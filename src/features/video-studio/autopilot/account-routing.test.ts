import { strict as assert } from 'node:assert';
import { buildAccountRouting } from './account-routing.ts';

const ALL = ['acc-a', 'acc-b', 'acc-c'];

// ---- no settings at all: nothing is narrowed ----
const open = buildAccountRouting({ connectedOwnerScopeIds: ALL });
assert.equal(open.imageAccounts, undefined);
assert.equal(open.videoAccountsFor('Gemini_Omni_Flash'), undefined, 'no capability map = no restriction');
assert.deepEqual(open.filterVideoChain(['Veo_3.1-Fast', 'Gemini_Omni_Flash']), ['Veo_3.1-Fast', 'Gemini_Omni_Flash']);

// ---- account allowlist only ----
const picked = buildAccountRouting({ connectedOwnerScopeIds: ALL, flowAccounts: ['acc-b'] });
assert.deepEqual(picked.imageAccounts, ['acc-b'], 'images run on the picked accounts');
assert.deepEqual(picked.videoAccountsFor('Veo_3.1-Fast'), ['acc-b']);

// ---- capability map: only acc-a owns Omni ----
const mixed = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  accountVideoModels: { 'acc-b': ['Veo_3.1-Fast'], 'acc-c': ['Veo_3.1-Fast', 'Veo_3.1-Lite'] },
});
assert.deepEqual(mixed.videoAccountsFor('Gemini_Omni_Flash'), ['acc-a'], 'only the account that owns it');
assert.deepEqual(mixed.videoAccountsFor('Veo_3.1-Lite'), ['acc-a', 'acc-c']);
assert.equal(mixed.videoAccountsFor('Veo_3.1-Fast'), undefined, 'every account owns it = no restriction');
assert.equal(mixed.imageAccounts, undefined, 'the video map never restricts images');

// ---- a model nobody owns is dropped before the first request ----
const noOmni = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  accountVideoModels: { 'acc-a': ['Veo_3.1-Fast'], 'acc-b': ['Veo_3.1-Fast'], 'acc-c': ['Veo_3.1-Fast'] },
});
assert.deepEqual(noOmni.videoAccountsFor('Gemini_Omni_Flash'), []);
assert.deepEqual(
  noOmni.filterVideoChain(['Gemini_Omni_Flash', 'Veo_3.1-Fast']),
  ['Veo_3.1-Fast'],
  'an unowned model must not eat an attempt',
);

// A chain of nothing but unowned models is a misconfiguration, not a routing
// decision: keep it so the run fails loudly instead of doing nothing.
assert.deepEqual(noOmni.filterVideoChain(['Gemini_Omni_Flash']), ['Gemini_Omni_Flash']);

// ---- allowlist and capability map together ----
const both = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  flowAccounts: ['acc-a', 'acc-b'],
  accountVideoModels: { 'acc-b': ['Veo_3.1-Fast'], 'acc-c': ['Gemini_Omni_Flash'] },
});
assert.deepEqual(both.videoAccountsFor('Gemini_Omni_Flash'), ['acc-a'], 'acc-c owns it but is not allowed');
assert.deepEqual(both.videoAccountsFor('Veo_3.1-Fast'), ['acc-a', 'acc-b']);

// ---- blanks and duplicates never create a phantom account ----
const messy = buildAccountRouting({
  connectedOwnerScopeIds: [' acc-a ', 'acc-a', ''],
  accountVideoModels: { 'acc-a': ['Veo_3.1-Fast'] },
});
assert.deepEqual(messy.videoAccountsFor('Gemini_Omni_Flash'), []);
assert.deepEqual(messy.videoAccountsFor('Veo_3.1-Fast'), undefined);

// ---- images get the same per-account treatment as videos ----
const perImage = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  accountImageModels: { 'acc-b': ['NARWHAL'] },
});
assert.deepEqual(perImage.imageAccountsFor('GEM_PIX_2'), ['acc-a', 'acc-c'], 'acc-b was told not to run it');
assert.equal(perImage.imageAccountsFor('NARWHAL'), undefined, 'every account runs it = no restriction');
assert.deepEqual(perImage.filterImageChain(['GEM_PIX_2', 'NARWHAL']), ['GEM_PIX_2', 'NARWHAL']);
assert.equal(perImage.videoAccountsFor('Gemini_Omni_Flash'), undefined, 'the image map never restricts videos');

// ---- an empty list is not "runs nothing": it is no setting at all ----
// The picker shows a row with nothing picked as "follows the shared order", so a
// stored empty list would be a rule the user can neither see nor undo.
const emptied = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  accountImageModels: { 'acc-b': [] },
});
assert.equal(emptied.accountsFor('image', 'NARWHAL'), undefined, 'acc-b is back to running everything');
assert.deepEqual(emptied.modelChainsFor('image', ['NARWHAL']), {}, 'quality mode still hands out no chains');

// ---- speed mode: the account is picked first, so the model does not narrow it ----
const speed = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  routingMode: 'speed',
  accountImageModels: { 'acc-c': ['GEM_PIX_2'] },
});
assert.equal(speed.accountsFor('image', 'NARWHAL'), undefined, 'acc-c runs only GEM_PIX_2 but is not excluded here');
assert.equal(speed.accountsFor('image', 'GEM_PIX_2'), undefined, 'same answer whatever the model');
assert.deepEqual(
  speed.modelChainsFor('image', ['NARWHAL']),
  { 'acc-a': ['NARWHAL'], 'acc-b': ['NARWHAL'], 'acc-c': ['GEM_PIX_2'] },
  'the chain is what keeps acc-c off NARWHAL, not the account list',
);

// ---- quality mode: the shared chain drives, so accounts do narrow per model ----
const quality = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  accountImageModels: { 'acc-c': ['GEM_PIX_2'] },
});
assert.deepEqual(quality.accountsFor('image', 'NARWHAL'), ['acc-a', 'acc-b'], 'acc-c runs only GEM_PIX_2');
assert.equal(quality.accountsFor('image', 'GEM_PIX_2'), undefined, 'every account runs it');
assert.deepEqual(
  quality.modelChainsFor('image', ['NARWHAL', 'GEM_PIX_2']),
  {},
  'quality mode hands out no per-account chain — the order belongs to the job',
);

// ---- per-account order: explicit wins, unset inherits, order is preserved ----
const ordered = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  routingMode: 'speed',
  accountImageModels: { 'acc-a': ['GEM_PIX_2', 'NARWHAL'], 'acc-b': [] },
});
const chains = ordered.modelChainsFor('image', ['NARWHAL', 'GEM_PIX_2']);
assert.deepEqual(chains['acc-a'], ['GEM_PIX_2', 'NARWHAL'], 'its own order, not the shared one');
assert.deepEqual(chains['acc-c'], ['NARWHAL', 'GEM_PIX_2'], 'no list of its own = the shared order');
assert.deepEqual(chains['acc-b'], ['NARWHAL', 'GEM_PIX_2'], 'an empty list is no list, so it inherits too');

// A shared chain of nothing leaves every account chainless, so the runtime falls
// back to the model on the request itself instead of inventing one.
assert.deepEqual(ordered.modelChainsFor('video', []), {});

// An account outside the allowlist never gets a chain, however it is configured.
const scoped = buildAccountRouting({
  connectedOwnerScopeIds: ALL,
  routingMode: 'speed',
  flowAccounts: ['acc-a'],
  accountImageModels: { 'acc-c': ['NARWHAL'] },
});
assert.deepEqual(Object.keys(scoped.modelChainsFor('image', ['GEM_PIX_2'])), ['acc-a']);

console.log('account-routing tests passed');
