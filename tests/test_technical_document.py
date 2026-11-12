"""Check the technical plan's links, example protocol and acceptance coverage."""

import json
from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
DOCUMENT = ROOT / "docs" / "双端本地游戏技术方案.md"


class TechnicalDocumentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = DOCUMENT.read_text(encoding="utf-8")

    def test_structure_and_local_links(self):
        numbers = re.findall(r"^## (\d+)\. ", self.content, re.MULTILINE)
        self.assertEqual([int(n) for n in numbers], list(range(1, 15)))
        for link in re.findall(r"\[[^\]]+\]\(([^)]+)\)", self.content):
            with self.subTest(link=link):
                if link.startswith("https://"):
                    self.assertNotRegex(link, r"\s")
                else:
                    self.assertTrue((DOCUMENT.parent / link).is_file())
        product = (DOCUMENT.parent / "MVP产品设计.md").read_text(encoding="utf-8")
        self.assertIn("./双端本地游戏技术方案.md", product)
        self.assertNotIn("首版暂定为浏览器端", product)

    def test_example_save_is_portable_and_contains_no_delivery_secrets(self):
        examples = re.findall(r"```json\n(.*?)\n```", self.content, re.DOTALL)
        self.assertEqual(len(examples), 1)
        save = json.loads(examples[0])
        self.assertEqual(save["format"], "traveling-feiyv-save")
        for key in ("schemaVersion", "contentVersion", "revision"):
            self.assertIs(type(save[key]), int)
            self.assertGreater(save[key], 0)
        self.assertLessEqual(save["lastSettledAt"], save["savedAt"])
        self.assertEqual(save["state"]["status"], "home")
        self.assertIsNone(save["state"]["trip"])
        self.assertGreaterEqual(save["state"]["coins"], 0)
        self.assertTrue(all(isinstance(v, int) and v >= 0
                            for v in save["state"]["inventory"].values()))
        self.assertIsInstance(save["events"], list)
        self.assertNotRegex(examples[0].lower(), r"token|secret|credential|outbox")

    def test_acceptance_matrix_and_repository_commands(self):
        ids = re.findall(r"^\| (T\d+) \|", self.content, re.MULTILINE)
        self.assertEqual(ids, [f"T{i:02d}" for i in range(1, 10)])
        # Each table must have a separator and consistent column counts.
        tables = re.findall(r"(?:^\|[^\n]+\n)+", self.content, re.MULTILINE)
        self.assertGreaterEqual(len(tables), 2)
        for table in tables:
            rows = table.strip().splitlines()
            self.assertIn("---", rows[1])
            self.assertTrue(all(len(row.split("|")) == len(rows[0].split("|"))
                                for row in rows))
        node_command = re.search(r"^node --test (.+)$", self.content, re.MULTILINE)
        self.assertIsNotNone(node_command)
        for path in node_command.group(1).split():
            self.assertTrue((ROOT / path).is_file(), path)
        self.assertNotRegex(self.content, r"(?i)\b(?:TODO|TBD|FIXME)\b")


if __name__ == "__main__":
    unittest.main()
