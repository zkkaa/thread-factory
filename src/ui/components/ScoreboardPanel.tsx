import type { ScoreboardData } from '../../progress/scoreboardStore';
import { buildScoreboard } from '../scoreboardView';

interface ScoreboardPanelProps {
  data: Readonly<ScoreboardData>;
  levels: readonly { id: string; title: string }[];
}

/** Papan skor lokal: rekor terbaik per level dan seed (hanya hasil yang benar). */
export function ScoreboardPanel({ data, levels }: ScoreboardPanelProps) {
  const boards = buildScoreboard(data, levels);

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border border-navy-500 bg-navy-800 px-4 py-3"
      aria-label="Papan skor"
    >
      <h2 className="font-bold">Papan Skor</h2>
      <p className="text-sm text-ink-300">
        Rekor di perangkat ini, dikelompokkan per seed supaya adil
        dibandingkan. Hanya hasil yang benar yang dicatat. Ikut terhapus saat
        progres direset.
      </p>
      {boards.length === 0 ? (
        <p className="text-sm">
          Belum ada rekor. Selesaikan sebuah level dengan benar untuk
          mencatatnya.
        </p>
      ) : (
        boards.map((board) => (
          <div key={board.levelId} className="flex flex-col gap-2">
            <h3 className="font-bold text-sun-400">
              Level {board.levelId}: {board.title}
            </h3>
            {board.seeds.map((seedBoard) => (
              <div key={seedBoard.seed} className="overflow-x-auto">
                <p className="text-sm font-semibold">Seed {seedBoard.seed}</p>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-navy-500 text-ink-300">
                      <th scope="col" className="py-1 pr-2">
                        Peringkat
                      </th>
                      <th scope="col" className="py-1 pr-2">
                        Bintang
                      </th>
                      <th scope="col" className="py-1 pr-2">
                        Tick
                      </th>
                      <th scope="col" className="py-1 pr-2">
                        Tunggu
                      </th>
                      <th scope="col" className="py-1">
                        Tanggal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {seedBoard.rows.map((row) => (
                      <tr key={row.rank} className="border-b border-navy-700">
                        <th scope="row" className="py-1 pr-2 font-normal">
                          #{row.rank}
                        </th>
                        <td className="py-1 pr-2">{row.stars}</td>
                        <td className="py-1 pr-2">{row.ticks}</td>
                        <td className="py-1 pr-2">{row.waitTicks}</td>
                        <td className="py-1">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        ))
      )}
    </section>
  );
}