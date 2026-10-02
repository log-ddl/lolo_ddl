"""Execute generated notebook in fresh namespaces with mocked cloud/install boundaries."""
import json
import pathlib
import shutil
import subprocess
import sys
import types
import zipfile
from unittest.mock import patch

notebook = json.loads(pathlib.Path(sys.argv[1]).read_text())
root = pathlib.Path(sys.argv[4]) / 'simulated-content'
source = notebook['cells'][1]['source'].replace('/content/', str(root) + '/')
calls, downloads = [], []
current_zip = pathlib.Path(sys.argv[2])
fail_install = False


def run(args, **kwargs):
    global fail_install
    calls.append(args)
    if fail_install and 'pip' in args:
        fail_install = False
        raise subprocess.CalledProcessError(1, args)
    if len(args) > 1 and args[1].endswith('colab_runner.py'):
        task_root = pathlib.Path(args[2])
        manifest = json.loads((task_root / 'tasks.json').read_text())
        out = task_root / 'results'
        out.mkdir(exist_ok=True)
        report = {'jobs': [{'id': j['id'], 'status': 'done'} for j in manifest['jobs']]}
        (out / 'results.json').write_text(json.dumps(report))
        with zipfile.ZipFile(task_root / f"logdd-results-{manifest['packId']}.zip", 'w') as archive:
            archive.writestr('results.json', json.dumps(report))
    return types.SimpleNamespace(returncode=0)


files = types.SimpleNamespace(upload=lambda: {'tasks.zip': current_zip.read_bytes()}, download=downloads.append)
colab = types.ModuleType('google.colab')
colab.files = files
with patch.dict(sys.modules, {'google': types.ModuleType('google'), 'google.colab': colab}), patch.object(subprocess, 'run', run), patch.object(shutil, 'which', lambda name: '/mock/nvidia-smi'):
    # Fresh kernel: no Path, manifest, ROOT, PYTHON, subprocess or json globals.
    exec(source, {})
    assert len(downloads) == 1
    # Installation failure and then another fresh run must work, not reuse stale globals.
    fail_install = True
    try:
        exec(source, {})
        raise AssertionError('Expected install failure')
    except subprocess.CalledProcessError:
        pass
    exec(source, {})
    assert len(downloads) == 2
    current_zip = pathlib.Path(sys.argv[3])
    exec(source, {})
    assert any('openai-whisper==20231117' in call for call in calls)
    assert len(downloads) == 3
    with patch.object(shutil, 'which', lambda name: None):
        try:
            exec(source, {})
            raise AssertionError('Expected GPU error')
        except RuntimeError as exc:
            assert 'GPU' in str(exc)
    before = len(calls)
    files.upload = lambda: {}
    try:
        exec(source, {})
        raise AssertionError('Expected upload validation')
    except ValueError:
        pass
    assert len(calls) == before, 'Failed upload must not reuse previous manifest'
    # Download-only cell also works in a fresh namespace and selects an explicit package.
    displayed = []
    class Dropdown:
        def __init__(self, options, **kwargs):
            self.value = options[0][1]
    class Button:
        def __init__(self, **kwargs):
            pass
        def on_click(self, fn):
            self.click = lambda: fn(self)
    with patch.dict(sys.modules, {'ipywidgets': types.SimpleNamespace(Dropdown=Dropdown, Button=Button), 'IPython': types.ModuleType('IPython'), 'IPython.display': types.SimpleNamespace(display=lambda *items: displayed.extend(items))}):
        exec(notebook['cells'][3]['source'].replace('/content/', str(root) + '/'), {})
        displayed[1].click()
        assert pathlib.Path(downloads[-1]).is_file()
print('PASS: fresh kernel, Qwen/Cosy setup flow, failed install/retry, missing GPU, failed upload, independent download.')
