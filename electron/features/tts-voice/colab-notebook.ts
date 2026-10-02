import fs from 'node:fs'
import path from 'node:path'
import { COLAB_MODELS } from './colab-package'

/** The notebook embeds only our bundled runner. Uploaded archives are strictly data. */
export function createColabNotebook(pythonRoot: string) {
  const scripts = Object.fromEntries(['local_models_worker.py', 'cosy_mps_adapter.py', 'colab_runner.py'].map(name => [name, fs.readFileSync(path.join(pythonRoot, name), 'utf8')]))
  const cells: { cell_type: string; metadata: object; source: string; execution_count?: null; outputs?: object[] }[] = []
  const markdown = (source: string) => cells.push({ cell_type: 'markdown', metadata: {}, source })
  const code = (source: string) => cells.push({ cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source })
  markdown(`# logdd · TTS trên Colab\n\n1. Chọn **Runtime → Change runtime type → GPU**.\n2. Bấm chạy ô duy nhất bên dưới rồi chọn ZIP tác vụ. Ô này tự chuẩn bị môi trường, tạo audio và tải kết quả.\n3. Lưu ZIP kết quả, quay lại TTS Studio → **Nhập kết quả**.\n\nMuốn tải lại file, dùng ô tải kết quả bên dưới. Chạy lại ô chính sẽ tạo lại audio.\n\nClone dài được chia tự động thành đoạn khoảng 1 phút khi xuất gói, chạy tuần tự với cùng audio mẫu rồi ghép thành một file. Model được giữ trong bộ nhớ cho cả lô. Phiên mới cần tải lại thư viện/model; lần đầu có thể mất vài phút. Không lượng tử hóa model. Giọng thiết kế có thể khác giữa các lần sinh; để giữ một giọng, dùng model Base cùng audio mẫu. Nội dung và audio mẫu được tải lên phiên Colab của bạn.`)
  code(`from google.colab import files
from pathlib import Path
import hashlib, io, json, re, zipfile

uploaded = files.upload()
if len(uploaded) != 1:
    raise ValueError('Upload exactly one tasks ZIP.')
data = next(iter(uploaded.values()))
limit = 256 * 1024 * 1024
if len(data) > limit:
    raise ValueError('ZIP exceeds 256 MB')
archive = zipfile.ZipFile(io.BytesIO(data))
entries = archive.infolist()
if len(entries) > 1000 or sum(e.file_size for e in entries) > limit:
    raise ValueError('Archive too large')
names = [e.filename for e in entries]
if len(names) != len(set(names)):
    raise ValueError('Duplicate archive entries')
for name in names:
    if not name or name.startswith('/') or '\\\\' in name or ':' in name or any(p in ('.', '..') for p in name.split('/')):
        raise ValueError('Invalid archive path')
raw = archive.read('tasks.json')
manifest = json.loads(raw)
models = json.loads(${JSON.stringify(JSON.stringify(COLAB_MODELS))})
model = models.get(manifest.get('modelId'))
if manifest.get('format') != 'logdd-tts-tasks' or manifest.get('version') != 1 or not model:
    raise ValueError('Unsupported task package')
if manifest.get('repository') != model['repository'] or manifest.get('engine') != model['engine']:
    raise ValueError('Unsupported model')
valid_id = lambda value: isinstance(value, str) and re.fullmatch(r'[a-zA-Z0-9_-]{1,100}', value)
if not valid_id(manifest.get('packId')):
    raise ValueError('Invalid package ID')
jobs = manifest.get('jobs', [])
if not isinstance(jobs, list) or not 1 <= len(jobs) <= 100:
    raise ValueError('Expected 1–100 tasks')
seen = set()
for job in jobs:
    if not valid_id(job.get('id')) or job['id'] in seen or job.get('mode') != model['mode']:
        raise ValueError('Invalid task')
    seen.add(job['id'])
    parts = job.get('parts')
    if not isinstance(parts, list) or not parts or not all(isinstance(p, str) and p.strip() for p in parts) or sum(map(len, parts)) > 100000:
        raise ValueError('Invalid task text')
    ref = job.get('referenceAudioPath')
    if ref and (ref not in names or not ref.startswith('references/')):
        raise ValueError('Missing reference audio')
ROOT = Path('/content/logdd-tts') / manifest['packId']
ROOT.mkdir(parents=True, exist_ok=True)
(ROOT / 'tasks.json').write_bytes(raw)
for name in names:
    if name.startswith('references/') and not name.endswith('/'):
        target = (ROOT / name).resolve()
        if not target.is_relative_to(ROOT.resolve()):
            raise ValueError('Invalid reference path')
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(archive.read(name))
print(f"Ready: {len(jobs)} tasks · {manifest['repository']}")`)
  markdown('## Chuẩn bị môi trường GPU\nChỉ cần chạy một lần mỗi phiên cho engine đang dùng. Giữ nguyên thư viện của Colab bằng môi trường Python riêng.')
  code(`import subprocess, sys
from pathlib import Path
import json, shutil
if shutil.which('nvidia-smi') is None:
    raise RuntimeError('Chưa có GPU. Chọn Runtime > Change runtime type > GPU rồi chạy lại ô này.')
subprocess.run(['nvidia-smi'], check=True)
subprocess.run([sys.executable, '-m', 'pip', 'install', '-q', 'uv==0.12.3'], check=True)
env = Path('/content/logdd-env-' + manifest['engine'])
subprocess.run([sys.executable, '-m', 'uv', 'venv', '--python', '3.12', '--seed', '--allow-existing', str(env)], check=True)
PYTHON = str(env / 'bin/python')
subprocess.run([PYTHON, '-m', 'pip', 'install', '-q', 'wheel', 'setuptools<81'], check=True)
if manifest['engine'] == 'qwen3':
    packages = ['torch==2.8.0', 'torchaudio==2.8.0', 'qwen-tts==0.1.1', 'transformers==4.57.3', 'soundfile==0.13.1']
else:
    packages = ['torch==2.3.1', 'torchaudio==2.3.1', 'numpy==1.26.4', 'transformers==4.51.3', 'conformer==0.3.2', 'diffusers==0.29.0', 'hydra-core==1.3.2', 'HyperPyYAML==1.2.3', 'inflect==7.3.1', 'librosa==0.10.2', 'lightning==2.2.4', 'modelscope==1.20.0', 'onnxruntime==1.18.0', 'rich==13.7.1', 'soundfile==0.12.1', 'x-transformers==2.11.24', 'wetext==0.0.4', 'wget==3.2', 'pyarrow==18.1.0', 'gdown==5.1.0', 'matplotlib==3.9.4', 'Cython==3.0.12']
subprocess.run([PYTHON, '-m', 'pip', 'install', '-q', *packages], check=True)
if manifest['engine'] == 'cosyvoice':
    subprocess.run([PYTHON, '-m', 'pip', 'install', '-q', '--no-build-isolation', 'openai-whisper==20231117', 'pyworld==0.3.4'], check=True)
scripts = json.loads(${JSON.stringify(JSON.stringify(scripts))})
RUNNER = Path('/content/logdd-runner')
RUNNER.mkdir(exist_ok=True)
for name, source in scripts.items():
    (RUNNER / name).write_text(source, encoding='utf-8')
print('Environment ready.')`)
  markdown('## Tạo audio\nChạy cả lô. Một tác vụ lỗi không làm mất kết quả của các tác vụ còn lại. Mỗi lần chạy lại ô này sẽ sinh lại audio.')
  code(`subprocess.run([PYTHON, str(RUNNER / 'colab_runner.py'), str(ROOT)], check=True)
report = json.loads((ROOT / 'results/results.json').read_text())
print('Success:', sum(j['status'] == 'done' for j in report['jobs']), '/', len(report['jobs']))
for job in report['jobs']:
    if job['status'] == 'error':
        print(job['id'], job['error'])`)
  markdown('## Tải kết quả về máy\nNếu trình duyệt hỏi vị trí lưu, chọn thư mục rồi xác nhận. Trong app chọn **Nhập kết quả** và mở ZIP này. Có thể chạy lại riêng ô tải xuống.')
  code(`result_zip = ROOT / f"logdd-results-{manifest['packId']}.zip"
files.download(str(result_zip))`)
  // A single self-contained execution scope prevents stale or missing variables
  // after a kernel restart, skipped cell, or an earlier failed upload.
  const pipeline = cells.filter(cell => cell.cell_type === 'code').map(cell => cell.source).join('\n\n# --- NEXT STAGE ---\n\n')
  const singleCell = 'def run_logdd_tts():\n' + pipeline.split('\n').map(line => '    ' + line).join('\n') + '\n\nrun_logdd_tts()\n'
  const notebookCells = [cells[0], {
    cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source: singleCell,
  }, {
    cell_type: 'markdown', metadata: {}, source: '### Tải lại kết quả (không tạo lại audio)\nÔ tùy chọn bên dưới tìm các ZIP đã tạo trong phiên hiện tại. Chọn đúng gói rồi bấm tải. Nếu Colab đã xóa phiên máy, cần chạy lại ô chính và tải ZIP tác vụ lên lần nữa.',
  }, {
    cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source: `from pathlib import Path
from google.colab import files
import ipywidgets as widgets
from IPython.display import display

def show_logdd_downloads():
    paths = sorted(Path('/content/logdd-tts').glob('*/logdd-results-*.zip'), key=lambda p: p.stat().st_mtime, reverse=True)
    if not paths:
        print('Chưa có ZIP kết quả trong phiên này. Hãy chạy ô chính trước.')
        return
    choices = widgets.Dropdown(options=[(p.name, str(p)) for p in paths], description='Gói:')
    button = widgets.Button(description='Tải kết quả')
    button.on_click(lambda _: files.download(choices.value))
    display(choices, button)

show_logdd_downloads()
`,
  }]
  return JSON.stringify({ nbformat: 4, nbformat_minor: 5, metadata: { colab: { name: 'logdd-tts.ipynb' }, accelerator: 'GPU', kernelspec: { name: 'python3', display_name: 'Python 3' }, language_info: { name: 'python' } }, cells: notebookCells }, null, 2)
}
