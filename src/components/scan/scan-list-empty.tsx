/**
 * 読取リストが空のときの枠。
 * 初回は出さず、登録後クリアや連続0件終了のあとだけ使う。
 */

type ScanListEmptyProps = {
  sectionId: string;
  headingId: string;
  title: string;
};

export function ScanListEmpty({
  sectionId,
  headingId,
  title,
}: ScanListEmptyProps) {
  return (
    <section
      id={sectionId}
      className="space-y-2 rounded-md border border-dashed border-zinc-500 bg-zinc-900/40 px-4 py-3"
      aria-labelledby={headingId}
    >
      <h3 id={headingId} className="text-sm font-medium text-zinc-200">
        {title}
      </h3>
      <p className="text-sm text-zinc-400">
        まだありません。スキャンまたは手動入力で照会してください。
      </p>
    </section>
  );
}
