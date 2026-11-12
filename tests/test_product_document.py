"""Run with: python -m unittest discover -s tests -v"""

from pathlib import Path
import re
import unittest


DOCUMENT = Path(__file__).resolve().parents[1] / "docs" / "MVP产品设计.md"


class ProductDocumentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = DOCUMENT.read_text(encoding="utf-8")

    def test_required_product_decisions_are_present(self):
        """Keep the brief useful as a scope and acceptance reference."""
        headings = re.findall(r"^## \d+\. (.+)$", self.content, re.MULTILINE)
        self.assertEqual(headings, [
            "产品方向", "首版要验证什么", "核心体验循环", "主要功能",
            "页面与视觉方向", "首版边界", "验收与试玩观察", "后续方向",
        ])
        for decision in ("离线", "本地自动保存", "奖励只能领取一次", "首版边界"):
            with self.subTest(decision=decision):
                self.assertIn(decision, self.content)

    def test_feature_table_is_well_formed(self):
        rows = [line for line in self.content.splitlines() if line.startswith("|")]
        self.assertEqual(len(rows), 10)  # Header, separator, eight core features.
        for row in rows:
            with self.subTest(row=row):
                self.assertEqual(len(row.split("|")), 5)

    def test_reference_links_and_no_unfinished_placeholders(self):
        links = re.findall(r"\[[^\]]+\]\(([^)]+)\)", self.content)
        self.assertTrue(links)
        for link in links:
            with self.subTest(link=link):
                if link.startswith("https://"):
                    self.assertNotRegex(link, r"\s")
                else:
                    self.assertTrue((DOCUMENT.parent / link).exists())
        self.assertNotRegex(self.content, r"(?i)\b(?:TODO|TBD|FIXME)\b")


if __name__ == "__main__":
    unittest.main()
