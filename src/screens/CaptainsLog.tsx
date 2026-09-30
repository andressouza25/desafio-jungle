import { useState, type ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { MatchRecord, Page, RankingEntry } from '../api/contracts';
import { useMatchHistory, useRanking } from '../api/useMatchQueries';
import { DEFAULT_GAME_CONFIG, snapshotGameConfig, type GameConfig } from '../game/config/GameConfig';
import { loadOptions } from '../storage/options';
import { ArtButton } from '../components/ui/ArtButton';
import { ScreenShell } from '../components/ui/ScreenShell';

import { LOCAL_CAPTAIN_ID } from '../api/localCaptain';
export { LOCAL_CAPTAIN_ID } from '../api/localCaptain';

function currentConfig() {
  const options = loadOptions();
  return snapshotGameConfig({ ...DEFAULT_GAME_CONFIG,
    session: { durationSeconds: options.sessionDurationSeconds },
    spawn: { ...DEFAULT_GAME_CONFIG.spawn, intervalSeconds: options.enemySpawnIntervalSeconds } });
}

function label(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (character) => character.toUpperCase());
}

function configFields(value: object, prefix = ''): [string, number][] {
  return Object.entries(value).flatMap(([key, part]: [string, unknown]) => {
    const name = prefix ? `${prefix}: ${label(key)}` : label(key);
    if (typeof part === 'number') return [[name, part]];
    return typeof part === 'object' && part !== null ? configFields(part, name) : [];
  });
}

function Configuration({ config }: { config: GameConfig }) {
  return <details className="log-details"><summary>Gameplay configuration</summary>
    <dl>{configFields(config).map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl>
  </details>;
}

function Played({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en', {
    year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }).format(new Date(date))} UTC</time>;
}

function RecordDetails({ record }: { record: MatchRecord }) {
  return <details className="log-details"><summary>Match details</summary>
    <dl><div><dt>Match ID</dt><dd>{record.matchId}</dd></div>
      <div><dt>Player ID</dt><dd>{record.playerId}</dd></div></dl>
    <Configuration config={record.config} />
  </details>;
}

function LogFrame<T extends MatchRecord>({ title, query, page, setPage, onBack, onSwitch, context, children }: {
  title: 'Ranking' | 'Match History'; query: UseQueryResult<Page<T>>; page: number;
  setPage: (page: number) => void; onBack: () => void; onSwitch: () => void; context: ReactNode; children: ReactNode;
}) {
  const data = query.data;
  return <ScreenShell className="menu-panel--log">
    <p className="log-heading">Captain’s log</p>
    <nav className="log-tabs" aria-label="Captain’s log">
      {(['Ranking', 'Match History'] as const).map((tab) => <ArtButton key={tab} type="button"
        variant={title === tab ? 'primary' : 'secondary'} aria-current={title === tab ? 'page' : undefined}
        onClick={title === tab ? undefined : onSwitch}>{tab}</ArtButton>)}
    </nav>
    <h1 className="sr-only">{title}</h1>
    <div className="log-context">{context}</div>
    <div className="log-status">
      {query.isPending && <p role="status">Loading {title.toLowerCase()}…</p>}
      {data && query.isFetching && <p>Updating {title.toLowerCase()}…</p>}
      {query.isError && <div role="alert"><p>{data ? 'Could not refresh' : 'Could not load'} {title.toLowerCase()}. Try again.</p></div>}
      <button className="log-refresh" type="button" onClick={() => { void query.refetch(); }}>{query.isError ? 'Retry' : 'Refresh'}</button>
    </div>
    {data && (data.items.length ? children : <p className="log-empty">{title === 'Ranking'
      ? 'No ranked battles for this configuration yet.' : 'No completed battles yet.'}</p>)}
    <nav className="log-pagination" aria-label={`${title} pagination`}>
      <button className="round-button log-page-button log-page-button--previous" type="button" disabled={page <= 1} aria-label="Previous page" onClick={() => setPage(page - 1)} />
      <p role="status" aria-live="polite" aria-atomic="true">{data
        ? data.totalPages === 0 ? 'No pages' : `Page ${data.page} of ${data.totalPages}`
        : `Page ${page}${query.isPending ? ' loading' : ' unavailable'}`}</p>
      <button className="round-button log-page-button log-page-button--next" type="button" disabled={!data || page >= data.totalPages} aria-label="Next page" onClick={() => setPage(page + 1)} />
    </nav>
    <ArtButton type="button" onClick={onBack}>Main Menu</ArtButton>
  </ScreenShell>;
}

interface LogProps { onBack: () => void; onSwitch: () => void }

export function RankingScreen({ onBack, onSwitch }: LogProps) {
  const [page, setPage] = useState(1);
  const [config] = useState(currentConfig);
  const query = useRanking({ config, page, pageSize: 5 });
  return <LogFrame<RankingEntry> title="Ranking" {...{ query, page, setPage, onBack, onSwitch }} context={<>
    <p>{config.session.durationSeconds} second battles · {config.spawn.intervalSeconds} second spawn interval</p>
    <Configuration config={config} /></>}>
    <table className="log-table"><caption className="sr-only">Ranking, ordered by the server for this gameplay configuration</caption>
      <thead><tr><th scope="col">Rank</th><th scope="col">Captain</th><th scope="col">Points</th><th scope="col">Played</th></tr></thead>
      <tbody>{query.data?.items.map((record) => <tr key={record.matchId} data-local={record.playerId === LOCAL_CAPTAIN_ID}>
        <td data-label="Rank">{String(record.rank).padStart(2, '0')}</td>
        <th scope="row" data-label="Captain">{record.playerName} {record.playerId === LOCAL_CAPTAIN_ID && <span className="log-you">You</span>}<small>{record.playerId}</small></th>
        <td data-label="Points" className="log-score">{record.score}</td><td data-label="Played"><Played date={record.date} /></td>
      </tr>)}</tbody>
    </table>
  </LogFrame>;
}

export function HistoryScreen({ onBack, onSwitch }: LogProps) {
  const [page, setPage] = useState(1);
  const query = useMatchHistory({ playerId: LOCAL_CAPTAIN_ID, page, pageSize: 2 });
  return <LogFrame<MatchRecord> title="Match History" {...{ query, page, setPage, onBack, onSwitch }} context={<p>Captain 1 · Your recent battles</p>}>
    <table className="log-table"><caption className="sr-only">Your completed battles, most recent first</caption>
      <thead><tr><th scope="col">Date</th><th scope="col">Points</th><th scope="col">Duration</th><th scope="col">Result</th></tr></thead>
      <tbody>{query.data?.items.map((record) => <tr key={record.matchId}>
        <th scope="row" data-label="Date"><Played date={record.date} /><RecordDetails record={record} /></th>
        <td data-label="Points" className="log-score">{record.score}</td><td data-label="Duration">{record.durationSeconds} seconds</td>
        <td data-label="Result">{record.reason === 'timeout' ? 'Time up' : 'Defeated'}</td>
      </tr>)}</tbody>
    </table>
  </LogFrame>;
}
