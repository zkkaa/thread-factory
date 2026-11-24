import type { ScoreboardData } from '../../progress/scoreboardStore';
import { buildScoreboard } from '../scoreboardView';

interface ScoreboardPanelProps {
  data: Readonly<ScoreboardData>;
  levels: readonly { id: string; title: string }[];
}

const TH = 'px-3 py-2 text-xs font-black uppercase tracking-wide';

/** Papan skor lokal: rekor terbaik per level dan seed (hanya hasil yang benar). */
export function ScoreboardPanel({ data, levels }: ScoreboardPanelProps) {
  const boards = buildScoreboard(data, levels);

  return (
    <section className="flex flex-col gap-4 pt-1" aria-label="Papan skor">
      <div>
        <h2 className="text-2xl font-black">Papan Skor</h2>
        <p className="text-sm text-navy-700">
          Rekor di perangkat ini, dikelompokkan per seed supaya adil
          dibandingkan. Hanya hasil yang benar yang dicatat. Ikut terhapus saat
          progres direset.
        </p>
      </div>
      {boards.length === 0 ? (
        <p className="-rotate-1 self-start rounded-md border-[3px] border-navy-900 bg-sun-400 px-4 py-3 text-sm font-black shadow-[4px_4px_0_#0b1f3a]">
          Belum ada rekor. Selesaikan sebuah level dengan benar untuk
          mencatatnya.
        </p>
      ) : (
        boards.map((board) => (
          <div key={board.levelId} className="flex flex-col gap-3">
            <h3 className="-rotate-1 self-start border-[3px] border-navy-900 bg-[#b79ee0] px-3 py-0.5 text-lg font-black shadow-[3px_3px_0_#0b1f3a]">
              Level {board.levelId}: {board.title}
            </h3>
            {board.seeds.map((seedBoard) => (
              <div key={seedBoard.seed} className="flex flex-col gap-1">
                <p className="self-start rounded-full border-2 border-navy-900 bg-white px-3 text-sm font-black">
                  Seed {seedBoard.seed}
                </p>
                <div className="overflow-x-auto rounded-lg border-[3px] border-navy-900 bg-white/70 shadow-[3px_3px_0_#0b1f3a]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-sun-400">
                      <tr>
                        <th scope="col" className={TH}>
                          Peringkat
                        </th>
                        <th scope="col" className={TH}>
                          Bintang
                        </th>
                        <th scope="col" className={TH}>
                          Tick
                        </th>
                        <th scope="col" className={TH}>
                          Tunggu
                        </th>
                        <th scope="col" className={TH}>
                          Tanggal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {seedBoard.rows.map((row) => (
                        <tr
                          key={row.rank}
                          className="border-t-2 border-navy-900/20 even:bg-sun-400/10"
                        >
                          <th scope="row" className="px-3 py-1.5 font-normal">
                            <span
                              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border-2 border-navy-900 px-1 font-black ${
                                row.rank === 1 ? 'bg-sun-400' : 'bg-white'
                              }`}
                            >
                              #{row.rank}
                            </span>
                          </th>
                          <td className="px-3 py-1.5 font-bold">{row.stars}</td>
                          <td className="px-3 py-1.5 tabular-nums">
                            {row.ticks}
                          </td>
                          <td className="px-3 py-1.5 tabular-nums">
                            {row.waitTicks}
                          </td>
                          <td className="px-3 py-1.5 tabular-nums">
                            {row.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </section>
  );
}