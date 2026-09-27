import { generateExportData } from '../server/exportEngine.ts';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { result, format } = req.body || {};
    if (!result || !format) {
      res.status(400).json({ error: 'Result object and format are required.' });
      return;
    }

    const exportFile = generateExportData(result, format);
    res.setHeader('Content-Type', exportFile.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportFile.filename}"`);

    if (Buffer.isBuffer(exportFile.data)) {
      res.status(200).send(exportFile.data);
    } else {
      res.status(200).send(exportFile.data);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Export generation failed' });
  }
}
