"""python -m unittest test_halftone_qr  (from this folder, with segno, zxing-cpp, opencv-python-headless, pillow, numpy)."""
import os, sys, tempfile, unittest
import numpy as np
from PIL import Image
import segno

sys.path.insert(0, os.path.dirname(__file__))
import halftone_qr as h

PAY = 'https://example.com/pitch-score'


def picture(path, kind):
    """Synthetic test pictures: a dark scene, a flat mid-tone, and busy noise."""
    rng = np.random.default_rng(7)
    if kind == 'dark':
        a = np.full((400, 400, 3), 18, np.uint8); a[150:260, 170:230] = 230
    elif kind == 'flat':
        a = np.full((400, 400, 3), (196, 150, 120), np.uint8)
    else:
        a = rng.integers(0, 256, (400, 400, 3), dtype=np.uint8)
    Image.fromarray(a).save(path)


def code_for(src, margin=.24, dot=.3, M=16):
    qr = segno.make(PAY, error='h')
    mat = np.array([[bool(x) for x in r] for r in qr.matrix])
    pic = h.prepare_picture(src, mat.shape[0] * M)
    return qr, mat, h.render_code(mat, qr.version, pic, M, dot, margin=margin)


class HalftoneQR(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.mkdtemp()
        cls.pics = {}
        for k in ('dark', 'flat', 'noise'):
            p = os.path.join(cls.tmp, k + '.png'); picture(p, k); cls.pics[k] = p

    def test_plain_code_passes_every_case(self):
        p = os.path.join(self.tmp, 'plain.png'); segno.make(PAY, error='h').save(p, scale=10)
        v = h.verify(Image.open(p).convert('RGBA'), PAY)
        self.assertTrue(v['all_cases_both'], v['rows'])

    def test_alignment_centres_match_the_standard(self):
        self.assertEqual(h.align_centres(1, 21), [])
        self.assertEqual(h.align_centres(2, 25), [(18, 18)])
        self.assertEqual(len(h.align_centres(7, 45)), 6)            # 3x3 grid minus the three finder corners

    def test_module_averages_respect_the_margin(self):
        M, margin = 16, .24
        _, mat, code = code_for(self.pics['flat'], margin, M=M)
        lum = code.astype(np.float32) @ np.array([.2126, .7152, .0722], np.float32)
        N = mat.shape[0]
        mean = lum.reshape(N, M, N, M).mean(axis=(1, 3)) / 255
        tol = .01
        self.assertTrue(np.all(mean[mat] <= .5 - margin + tol), mean[mat].max())
        self.assertTrue(np.all(mean[~mat] >= .5 + margin - tol), mean[~mat].min())

    def test_finders_are_solid(self):
        M = 16
        _, mat, code = code_for(self.pics['noise'], M=M)
        corner = code[:7 * M, :7 * M].astype(int)
        want = np.kron(mat[:7, :7], np.ones((M, M), bool))
        self.assertTrue(np.all(corner[want] <= 17) and np.all(corner[~want] >= 255))

    def test_render_is_deterministic(self):
        a = code_for(self.pics['noise'])[2]; b = code_for(self.pics['noise'])[2]
        self.assertTrue(np.array_equal(a, b))

    def test_default_margin_scans_on_all_test_pictures(self):
        for k, p in self.pics.items():
            _, mat, code = code_for(p, M=24)
            img = h.frame(code, 24, 'card', 'example.com/pitch-score')
            v = h.verify(img, PAY)
            self.assertTrue(v['all_cases_both'], (k, [r for r in v['rows'] if not (r['zxing'] and r['opencv'])]))

    def test_no_margin_is_not_safe_for_strict_readers(self):
        # Documents why the margin exists: a dark picture without correction fails OpenCV.
        _, mat, code = code_for(self.pics['dark'], margin=0, M=24)
        v = h.verify(h.frame(code, 24, 'card', None), PAY)
        self.assertFalse(v['all_cases_both'])


if __name__ == '__main__':
    unittest.main()
