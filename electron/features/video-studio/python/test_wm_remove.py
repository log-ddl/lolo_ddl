"""Synthetic regression coverage; real provider captures remain necessary for calibration."""
import io
import unittest
import numpy as np
from PIL import Image
from wm_remove import load_v2_alpha_map, locate, clean_detected


def fixture(width, height, size, margin, textured=False):
    yy, xx = np.mgrid[:height, :width]
    base = 45 + 70 * xx / width + 30 * yy / height
    if textured:
        base += 8 * np.sin(xx / 7) * np.cos(yy / 11)
    original = np.stack([base, base + 15, base + 30], axis=2).astype(np.uint8)
    marked = original.copy()
    x, y = width - margin - size, height - margin - size
    alpha = load_v2_alpha_map(size, size)[..., None]
    marked[y:y+size, x:x+size] = np.rint(original[y:y+size, x:x+size] * (1-alpha) + 255*alpha)
    return original, marked, (x, y, size, size)


class RemovalTests(unittest.TestCase):
    def test_aspect_ratios_and_sizes(self):
        for width, height, size, margin in [
            (1376,768,50,71), (768,1376,48,39), (1024,1024,48,32),
            (1080,1080,50,60), (1200,900,60,80), (900,1200,72,90),
            (1600,400,36,24), (400,1600,36,24), (2048,2048,96,192),
            (256,256,24,16), (1536,1024,53,55),
        ]:
            with self.subTest(dimensions=(width,height), size=size):
                original, marked, expected = fixture(width,height,size,margin,True)
                found = locate(marked.mean(axis=2),width,height)
                self.assertIsNotNone(found)
                self.assertEqual(found[:4],expected)
                cleaned, method = clean_detected(marked,found)
                x,y,w,h = expected
                self.assertLess(np.abs(cleaned[y:y+h,x:x+w].astype(float)-original[y:y+h,x:x+w]).mean(),1.5)
                outside = np.ones((height,width),bool)
                outside[y:y+h,x:x+w] = False
                self.assertTrue(np.array_equal(cleaned[outside],marked[outside]))
                self.assertEqual(method,'verified-reverse-alpha-v2')

    def test_no_logo(self):
        rng = np.random.default_rng(42)
        for gray in [np.full((512,512),100,np.float32),rng.uniform(0,255,(512,512)).astype(np.float32),np.tile(np.arange(512,dtype=np.float32)%128,(512,1))]:
            self.assertIsNone(locate(gray,512,512))

    def test_jpeg_and_png_reencoding(self):
        original, marked, expected = fixture(768,1024,50,55)
        stream = io.BytesIO()
        Image.fromarray(marked).save(stream,format='JPEG',quality=85)
        stream.seek(0)
        compressed = np.asarray(Image.open(stream).convert('RGB'))
        found = locate(compressed.mean(axis=2),768,1024)
        self.assertIsNotNone(found)
        self.assertEqual(found[:4],expected)
        cleaned,_ = clean_detected(compressed,found)
        x,y,w,h = expected
        before = np.abs(compressed[y:y+h,x:x+w].astype(float)-original[y:y+h,x:x+w]).mean()
        after = np.abs(cleaned[y:y+h,x:x+w].astype(float)-original[y:y+h,x:x+w]).mean()
        self.assertLess(after,before*.35)

    def test_resized_image(self):
        original, marked, _ = fixture(1200,1600,96,120)
        original = np.asarray(Image.fromarray(original).resize((900,1200),Image.Resampling.LANCZOS))
        marked = np.asarray(Image.fromarray(marked).resize((900,1200),Image.Resampling.LANCZOS))
        found = locate(marked.mean(axis=2),900,1200)
        self.assertIsNotNone(found)
        cleaned,_ = clean_detected(marked,found)
        x,y,w,h = found[:4]
        before = np.abs(marked[y:y+h,x:x+w].astype(float)-original[y:y+h,x:x+w]).mean()
        after = np.abs(cleaned[y:y+h,x:x+w].astype(float)-original[y:y+h,x:x+w]).mean()
        self.assertLess(after,before*.4)

    def test_wrong_hint_does_not_force_edit(self):
        self.assertIsNone(locate(np.full((512,512),100,np.float32),512,512,(1,1,96,96)))


if __name__ == '__main__':
    unittest.main()
