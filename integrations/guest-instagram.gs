/* Optional Google Apps Script adapter. Deploy separately; this does not run on GitHub Pages.
   Script Properties: SHEET_ID = your private spreadsheet ID; OPEN = true when ready.
   Columns in the Guests sheet: name | handle | consentAt | visible.
   Keep the sheet private. Only the approved public name and handle are returned. */
function jsonResponse(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
function guestSheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SHEET_ID');
  if (!id) throw new Error('Not configured');
  var sheet = SpreadsheetApp.openById(id).getSheetByName('Guests');
  if (!sheet) throw new Error('Missing Guests sheet');
  return sheet;
}
function doGet() {
  try {
    var sheet = guestSheet();
    var rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, Math.min(sheet.getLastRow() - 1, 500), 4).getDisplayValues() : [];
    return jsonResponse({ guests: rows.filter(function(r) {
      return r[3].toLowerCase() === 'true' && /^[a-z0-9._]{1,30}$/i.test(r[1]);
    }).map(function(r) { return { name: r[0], handle: r[1] }; }) });
  } catch (error) { return jsonResponse({ error: 'List unavailable' }); }
}
function doPost(request) {
  var lock = LockService.getScriptLock();
  try {
    if (PropertiesService.getScriptProperties().getProperty('OPEN') !== 'true') return jsonResponse({ ok: false });
    var contents = request && request.postData && request.postData.contents;
    if (!contents || contents.length > 1000) return jsonResponse({ ok: false });
    var data = JSON.parse(contents);
    var name = typeof data.name === 'string' ? data.name.trim() : '';
    var handle = typeof data.handle === 'string' ? data.handle.trim().replace(/^@/, '').toLowerCase() : '';
    if (!name || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name) || !/^[a-z0-9._]{1,30}$/.test(handle) || data.consent !== true) return jsonResponse({ ok: false });
    if (!lock.tryLock(5000)) return jsonResponse({ ok: false });
    var sheet = guestSheet();
    var count = sheet.getLastRow();
    var handles = count > 1 ? sheet.getRange(2, 2, count - 1, 1).getDisplayValues() : [];
    // A public request cannot edit somebody else's existing entry.
    if (handles.some(function(r) { return r[0].toLowerCase() === handle; })) return jsonResponse({ ok: true });
    if (count > 500) return jsonResponse({ ok: false });
    var cache = CacheService.getScriptCache();
    if (cache.get('recent-submission')) return jsonResponse({ ok: false });
    cache.put('recent-submission', '1', 3);
    // Escape a potential spreadsheet formula; React also renders names as text.
    var safeName = /^[=+\-@']/.test(name) ? "'" + name : name;
    sheet.appendRow([safeName, handle, new Date().toISOString(), true]);
    return jsonResponse({ ok: true });
  } catch (error) { return jsonResponse({ ok: false }); }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}
