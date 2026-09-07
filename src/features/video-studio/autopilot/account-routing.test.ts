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

console.log('account-routing tests passed');
