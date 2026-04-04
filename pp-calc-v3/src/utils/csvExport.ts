import { Alert } from 'react-native';
import { File, Paths } from 'expo-file-system/next';
import * as Sharing from 'expo-sharing';
import { HistoryItem, BookmarkItem } from './types';

function escapeCell(value: string | number | null): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCSV(headers: string[], rows: (string | number | null)[][]): string {
  const headerRow = headers.map(escapeCell).join(',');
  const dataRows = rows.map(row => row.map(escapeCell).join(','));
  return [headerRow, ...dataRows].join('\n');
}

async function shareCSV(csv: string, filename: string): Promise<void> {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ts = `${yyyy}-${mm}-${dd}_${hh}-${min}`;
  const stampedName = filename.replace('.csv', `_${ts}.csv`);
  const file = new File(Paths.cache, stampedName);
  await file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: stampedName,
    UTI: 'public.comma-separated-values-text',
  });
}

export async function exportHistoryCSV(history: HistoryItem[]): Promise<void> {
  if (history.length === 0) {
    Alert.alert('エクスポート', '搭乗履歴がありません');
    return;
  }
  const headers = ['日付', '路線', '獲得PP', '航空券価格（円）', 'PP単価（円）'];
  const rows = history.map(h => [
    h.date,
    h.route,
    h.pp,
    h.price > 0 ? h.price : null,
    h.ppUnit > 0 ? h.ppUnit : null,
  ]);
  try {
    await shareCSV(buildCSV(headers, rows), '搭乗履歴.csv');
  } catch {
    Alert.alert('エラー', 'エクスポートに失敗しました');
  }
}

export async function exportBookmarksCSV(bookmarks: BookmarkItem[]): Promise<void> {
  if (bookmarks.length === 0) {
    Alert.alert('エクスポート', 'お気に入りがありません');
    return;
  }
  const headers = ['路線', '出発地', '到着地', '運賃', '片道PP', '往復PP', '達成往復数', 'PP単価（円）'];
  const rows = bookmarks.map(b => [
    b.route, b.dep, b.arr, b.fare, b.pp, b.ppRound, b.trips, b.ppUnit ?? null,
  ]);
  try {
    await shareCSV(buildCSV(headers, rows), 'お気に入り路線.csv');
  } catch {
    Alert.alert('エラー', 'エクスポートに失敗しました');
  }
}

export async function exportAllCSV(history: HistoryItem[], bookmarks: BookmarkItem[]): Promise<void> {
  if (history.length === 0 && bookmarks.length === 0) {
    Alert.alert('エクスポート', 'エクスポートするデータがありません');
    return;
  }
  const historyHeaders = ['日付', '路線', '獲得PP', '航空券価格（円）', 'PP単価（円）'];
  const historyRows = history.map(h => [
    h.date, h.route, h.pp,
    h.price > 0 ? h.price : null,
    h.ppUnit > 0 ? h.ppUnit : null,
  ]);
  const bookmarkHeaders = ['路線', '出発地', '到着地', '運賃', '片道PP', '往復PP', '達成往復数', 'PP単価（円）'];
  const bookmarkRows = bookmarks.map(b => [
    b.route, b.dep, b.arr, b.fare, b.pp, b.ppRound, b.trips, b.ppUnit ?? null,
  ]);
  const csv = [
    '# 搭乗履歴',
    buildCSV(historyHeaders, historyRows),
    '',
    '# お気に入り路線',
    buildCSV(bookmarkHeaders, bookmarkRows),
  ].join('\n');
  try {
    await shareCSV(csv, 'PPデータ.csv');
  } catch {
    Alert.alert('エラー', 'エクスポートに失敗しました');
  }
}
