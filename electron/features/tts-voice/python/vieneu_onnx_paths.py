"""Materialize SDK ONNX bundles without symlinks escaping the graph directory."""
import hashlib
import os
from pathlib import Path
import shutil
import uuid


def materialize_bundle(directory, filenames, cache_root):
    directory = Path(directory)
    sources = []
    for name in filenames:
        if Path(name).name != name or name in ('.', '..'):
            raise ValueError('Invalid ONNX bundle filename')
        source = directory / name
        if not source.is_file():
            if name.endswith('.json'):
                continue  # SDK treats metadata JSON as optional.
            raise FileNotFoundError(source)
        source = source.resolve(strict=True)
        stat = source.stat()
        sources.append((name, source, stat.st_size, stat.st_mtime_ns))
    identity = repr([(name, str(source), size, modified) for name, source, size, modified in sources])
    target = Path(cache_root) / hashlib.sha256(identity.encode()).hexdigest()
    target.mkdir(parents=True, exist_ok=True)
    for name, source, size, _ in sources:
        destination = target / name
        if destination.is_file() and not destination.is_symlink() and destination.stat().st_size == size:
            continue
        temporary = target / (name + '.' + uuid.uuid4().hex + '.tmp')
        try:
            # A hard link keeps the original bytes without duplicating large weights.
            # It resolves inside target, unlike a Hugging Face snapshot symlink.
            try:
                os.link(source, temporary)
            except OSError:
                shutil.copyfile(source, temporary)
            os.replace(temporary, destination)
        finally:
            temporary.unlink(missing_ok=True)
    return target


def create_vieneu_engine(use_accelerated_backend=False):
    from huggingface_hub.constants import HF_HOME
    from vieneu import Vieneu
    from vieneu._v3_turbo_engine.onnx_runtime_lite import OnnxV3LiteEngine
    original = OnnxV3LiteEngine._fetch

    def fetch(repo, files, subfolder):
        source = original(repo, files, subfolder)
        return materialize_bundle(source, files, Path(HF_HOME) / 'logdd-onnx-bundles')

    # Scoped to this SDK construction: both backbone and codec bundles need it.
    # Restore the method even if initialization fails; never alter ORT validation.
    OnnxV3LiteEngine._fetch = staticmethod(fetch)
    try:
        return Vieneu() if use_accelerated_backend else Vieneu(backend='onnx')
    finally:
        OnnxV3LiteEngine._fetch = staticmethod(original)
