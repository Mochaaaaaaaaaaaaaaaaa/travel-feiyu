"""Validate the actual SVG tree, not only the intended hit-area coordinates."""

import json
import re
from pathlib import Path
import subprocess
import unittest
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
VIEWPORTS = [(1920, 991), (1920, 1080), (1440, 900), (1050, 930), (390, 844), (320, 740)]


class SceneSvgTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        module_url = (ROOT / "demo/dist/scene.js").as_uri()
        program = (
            f"import {{ sceneLayout, homeArt }} from {json.dumps(module_url)};"
            f"console.log(JSON.stringify({json.dumps(VIEWPORTS)}.map(([w,h]) => {{"
            "const layout=sceneLayout(w,h);return {width:w,height:h,layout,svg:homeArt(layout)};"
            "})));"
        )
        result = subprocess.run(
            ["node", "--input-type=module", "-e", program],
            capture_output=True, text=True, encoding="utf-8", check=True, cwd=ROOT,
        )
        cls.scenes = json.loads(result.stdout)

    def test_generated_svg_is_well_formed_at_every_viewport(self):
        for scene in self.scenes:
            with self.subTest(viewport=(scene["width"], scene["height"])):
                root = ET.fromstring(scene["svg"])
                self.assertEqual(root.tag, "{http://www.w3.org/2000/svg}svg")

    def test_house_and_outdoor_props_are_siblings_not_nested(self):
        for scene in self.scenes:
            with self.subTest(viewport=(scene["width"], scene["height"])):
                root = ET.fromstring(scene["svg"])
                direct_ids = {element.get("id") for element in root}
                for object_id in ("scene-house", "scene-mail", "scene-garden", "scene-shop"):
                    self.assertIn(object_id, direct_ids, f"{object_id} must use the scene coordinate system")
                house = root.find(".//*[@id='scene-house']")
                desk = house.find(".//*[@id='desk-items']")
                self.assertIsNotNone(desk)
                # The desk adjustment must never translate the character or room.
                self.assertIsNone(desk.find(".//*[@id='frog-at-home']"))

    def test_illustrated_outdoor_positions_match_hit_regions(self):
        for scene in self.scenes:
            root = ET.fromstring(scene["svg"])
            layout = scene["layout"]
            dx, dy = layout["offsetX"], layout["offsetY"]
            for name in ("mail", "shop", "garden"):
                with self.subTest(viewport=(scene["width"], scene["height"]), prop=name):
                    element = root.find(f".//*[@id='scene-{name}']")
                    tx, ty = map(float, re.findall(r"[-+]?\d*\.?\d+(?:e[-+]?\d+)?", element.get("transform")))
                    x, y, width, height = layout["objects"][name]
                    if name != "garden":
                        self.assertAlmostEqual(tx, x + dx)
                        self.assertAlmostEqual(ty, y + dy)
                    else:
                        # The garden is painted around its center, unlike the other props.
                        self.assertTrue(x + dx <= tx <= x + dx + width)
                        self.assertTrue(y + dy <= ty <= y + dy + height)


if __name__ == "__main__":
    unittest.main()
