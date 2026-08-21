import json
from pathlib import Path

from app.extraction_agent import extract_faktur_data

DUMMY_DIR = Path(__file__).parent.parent / "data" / "dummy_faktur"
GROUND_TRUTH_PATH = DUMMY_DIR / "ground_truth.json"

# Hanya kasus "normal" (bukan kasus uji negatif Task 9/10, itu untuk compliance agent).
NORMAL_CASES = {
    "faktur-01-normal-11persen.png",
    "faktur-02-normal-12persen.png",
    "faktur-03-normal-12persen.png",
    "faktur-04-normal-12persen.png",
    "faktur-05-normal-12persen.png",
}

FIELDS = [
    "npwp_penjual",
    "npwp_pembeli",
    "tanggal_faktur",
    "nomor_seri_faktur",
    "dpp",
    "tarif_ppn",
    "ppn_terutang",
]


def values_match(expected, actual) -> bool:
    if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
        return abs(float(expected) - float(actual)) < 0.01
    return expected == actual


def main() -> None:
    cases = [c for c in json.loads(GROUND_TRUTH_PATH.read_text()) if c["file"] in NORMAL_CASES]

    field_correct = {f: 0 for f in FIELDS}
    field_total = {f: 0 for f in FIELDS}
    mismatches: list[str] = []

    for case in cases:
        image_bytes = (DUMMY_DIR / case["file"]).read_bytes()
        result = extract_faktur_data(image_bytes, media_type="image/png")

        if not result.readable or result.data is None:
            mismatches.append(f"{case['file']}: dianggap tidak terbaca (readable=False)")
            for f in FIELDS:
                field_total[f] += 1
            continue

        for f in FIELDS:
            field_total[f] += 1
            expected = case["expected"][f]
            actual = getattr(result.data, f).value
            if actual is not None and values_match(expected, actual):
                field_correct[f] += 1
            else:
                mismatches.append(f"{case['file']}: {f} expected={expected!r} actual={actual!r}")

    print(f"Evaluated {len(cases)} normal-case faktur\n")
    print(f"{'Field':<20}{'Correct':<10}{'Total':<8}{'Accuracy'}")
    for f in FIELDS:
        acc = field_correct[f] / field_total[f] * 100 if field_total[f] else 0
        print(f"{f:<20}{field_correct[f]:<10}{field_total[f]:<8}{acc:.1f}%")

    overall_correct = sum(field_correct.values())
    overall_total = sum(field_total.values())
    print(f"\nOverall: {overall_correct}/{overall_total} ({overall_correct / overall_total * 100:.1f}%)")

    if mismatches:
        print("\nMismatches:")
        for m in mismatches:
            print(f"  - {m}")


if __name__ == "__main__":
    main()
