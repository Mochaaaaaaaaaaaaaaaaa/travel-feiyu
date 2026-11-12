"""Check milestone coverage against the existing technical acceptance matrix."""

from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]
DOCUMENT = ROOT / "docs" / "完整项目设计与实施计划.md"


class ProjectPlanTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = DOCUMENT.read_text(encoding="utf-8")
        cls.technical = (DOCUMENT.parent / "双端本地游戏技术方案.md").read_text(encoding="utf-8")

    def test_milestones_cover_real_acceptance_items_without_claiming_implementation(self):
        rows = re.findall(r"^\| (M\d+ [^\n]+)$", self.content, re.MULTILINE)
        self.assertEqual([row.split()[0] for row in rows], [f"M{i}" for i in range(1, 7)])
        acceptance = set(re.findall(r"^\| (T\d+) \|", self.technical, re.MULTILINE))
        covered = set()
        for row in rows:
            cells = [cell.strip() for cell in row.rstrip("|").split("|")]
            self.assertEqual(len(cells), 5)
            self.assertEqual(cells[-1], "待实施")
            ids = set(re.findall(r"\bT\d+\b", cells[-2]))
            self.assertTrue(ids)
            self.assertLessEqual(ids, acceptance)
            covered.update(ids)
        self.assertEqual(covered, acceptance)

    def test_local_references_resolve_and_markdown_tables_have_consistent_columns(self):
        links = re.findall(r"\[[^\]]+\]\(([^)]+)\)", self.content)
        self.assertGreaterEqual(len(links), 3)
        for link in links:
            with self.subTest(link=link):
                self.assertTrue((DOCUMENT.parent / link).is_file())
        for table in re.findall(r"(?:^\|[^\n]+\n)+", self.content, re.MULTILINE):
            rows = table.strip().splitlines()
            self.assertIn("---", rows[1])
            self.assertEqual(len({len(row.split("|")) for row in rows}), 1)

    def test_delivery_and_optional_notification_boundaries_are_preserved(self):
        for decision in (
            "核心玩法不依赖账号、自建服务器或第三方接口",
            "保存成功后确认操作", "不重复领取", "渠道失败不阻塞单机交付",
            "单元测试不能替代安装、通知和生命周期验证",
            "下一批次只实施 M1", "Windows x64", "签名 release APK",
        ):
            with self.subTest(decision=decision):
                self.assertIn(decision, self.content)
        self.assertNotRegex(self.content, r"(?i)\b(?:TODO|TBD|FIXME)\b")


if __name__ == "__main__":
    unittest.main()
