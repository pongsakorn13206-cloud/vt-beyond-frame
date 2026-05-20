export function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

export function generateId() {
  return crypto.randomUUID();
}

export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getConfidenceColor(score) {
  if (score >= 0.85) return 'text-green-400';
  if (score >= 0.7) return 'text-yellow-400';
  return 'text-orange-400';
}

export function getConfidenceLabel(score) {
  if (score >= 0.85) return 'สูงมาก';
  if (score >= 0.7) return 'สูง';
  if (score >= 0.6) return 'ปานกลาง';
  return 'ต่ำ';
}

export async function downloadImage(url, filename) {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename || 'photo.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    window.open(url, '_blank');
  }
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
