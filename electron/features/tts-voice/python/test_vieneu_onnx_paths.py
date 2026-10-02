import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from vieneu_onnx_paths import materialize_bundle


class BundleTests(unittest.TestCase):
    def test_symlink_cache_is_materialized_and_reused(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            snapshot = root / 'snapshot'
            snapshot.mkdir()
            for name, content in [('graph.onnx', b'graph'), ('weights.data', b'weights')]:
                blob = root / name / 'blob'
                blob.parent.mkdir()
                blob.write_bytes(content)
                (snapshot / name).symlink_to(blob)
            target = materialize_bundle(snapshot, ['graph.onnx', 'weights.data'], root / 'bundles')
            for name in ['graph.onnx', 'weights.data']:
                self.assertFalse((target / name).is_symlink())
                self.assertEqual((target / name).resolve().parent, target.resolve())
                self.assertEqual((target / name).read_bytes(), (snapshot / name).read_bytes())
                self.assertTrue((snapshot / name).is_symlink())
            self.assertEqual(target, materialize_bundle(snapshot, ['graph.onnx', 'weights.data'], root / 'bundles'))

    def test_copy_fallback_and_missing_weights(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / 'graph.onnx').write_bytes(b'graph')
            with patch.object(os, 'link', side_effect=OSError('Different filesystem')):
                target = materialize_bundle(root, ['graph.onnx', 'optional.json'], root / 'bundles')
            self.assertEqual((target / 'graph.onnx').read_bytes(), b'graph')
            with self.assertRaises(FileNotFoundError):
                materialize_bundle(root, ['missing.data'], root / 'bundles')
            with self.assertRaises(ValueError):
                materialize_bundle(root, ['../outside'], root / 'bundles')


if __name__ == '__main__':
    unittest.main()
