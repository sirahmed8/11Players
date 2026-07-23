import { PlayerProfile } from '@/types';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

export function exportPlayersToCSV(players: PlayerProfile[], communityId: string) {
  // Define columns to export
  const headers = [
    'fullName',
    'phoneNumber',
    'primaryPosition',
    'secondaryPosition',
    'tertiaryPosition',
    'height',
    'weight',
    'dateOfBirth',
    'preferredFoot',
    'playStyle'
  ];

  // Convert players to CSV rows
  const rows = players.map(p => {
    return headers.map(header => {
      const val = (p as any)[header] || '';
      // Escape quotes and wrap in quotes if there's a comma
      const strVal = String(val).replace(/"/g, '""');
      return strVal.includes(',') ? `"${strVal}"` : strVal;
    }).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `community_${communityId}_players.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function importPlayersFromCSV(file: File, communityId: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) throw new Error('Empty file');
        
        const lines = text.split('\n').filter(l => l.trim() !== '');
        if (lines.length <= 1) throw new Error('No data rows found');
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const batch = writeBatch(db);
        let count = 0;

        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (row.length < headers.length) continue; // Skip malformed rows
          
          const playerData: any = {};
          headers.forEach((header, idx) => {
            if (row[idx]) {
              playerData[header] = row[idx];
            }
          });

          if (!playerData.fullName || !playerData.phoneNumber) continue;

          // Generate a new doc ref for the community player
          const docRef = doc(collection(db, 'communities', communityId, 'players'));
          playerData.uid = docRef.id;
          playerData.createdAt = new Date().toISOString();
          playerData.isVerifiedByAdmin = false;
          
          batch.set(docRef, playerData);
          count++;
        }

        if (count > 0) {
          await batch.commit();
        }
        resolve(count);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
