"""Быстрые проверки без фото людей: python -m unittest discover -s tests"""
import io
import sys
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app import colors, pipeline  # noqa: E402


def jpeg(arr):
    b = io.BytesIO()
    Image.fromarray(arr).save(b, "JPEG")
    return b.getvalue()


class Colors(unittest.TestCase):
    def test_names(self):
        rgb = np.zeros((100, 100, 3), np.uint8)
        rgb[:] = (200, 40, 40)
        name, _, share = colors.dominant_color(rgb, np.ones((100, 100), bool))
        self.assertEqual(name, "Красный")
        self.assertGreater(share, 0.9)
        rgb[:] = (245, 245, 240)
        self.assertEqual(colors.dominant_color(rgb, np.ones((100, 100), bool))[0], "Белый")


class Pipeline(unittest.TestCase):
    def test_pack_pair_puts_boots_side_by_side(self):
        rgb = np.full((200, 600, 3), 90, np.uint8)
        a = np.zeros((200, 600), np.uint8)
        a[60:140, 20:100] = 255
        a[60:140, 480:580] = 255
        out_rgb, out_a = pipeline.pack_pair(rgb, a)
        self.assertLess(out_rgb.shape[1], 400)  # расстояние между ботинками схлопнулось
        self.assertGreater((out_a > 128).sum(), 8000)

    def test_bad_bytes(self):
        with self.assertRaises(Exception):
            pipeline.load_image(b"not an image")

    def test_flat_empty_wall_is_not_clothing_or_has_no_items(self):
        # однотонная стена без вещи: ничего не нашли
        res = pipeline.analyze(jpeg(np.full((480, 640, 3), 200, np.uint8)))
        self.assertTrue(res.notClothing or not res.items)


if __name__ == "__main__":
    unittest.main()
