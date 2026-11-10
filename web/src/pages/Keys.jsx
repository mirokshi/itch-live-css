// "Mis claves": the edit links of every config the user saved. They are kept in this browser, can be
// downloaded as a text file or imported from one, and can be backed up encrypted on the server with
// email + password (src/keychain.js). The email and password never leave the browser.

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Inline, Navbar } from '../common.jsx';
import * as keychain from '../keychain.js';
import { Page, Title } from './Content.jsx';

const MIN_PASSWORD = 12;

export function Keys() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState(null); // { id, params }: a text of locales/
  const [busy, setBusy] = useState(false);

  useEffect(() => setEntries(keychain.list()), []); // localStorage doesn't exist while prerendering

  function add(found) {
    setEntries(keychain.merge(found));
    setStatus({ id: 'keys.added', params: { count: found.length } });
  }
  async function importFile(ev) {
    const file = ev.target.files[0];
    ev.target.value = '';
    if (file) add(keychain.parseText(await file.text()));
  }
  function download() {
    const url = URL.createObjectURL(new Blob([keychain.toText(entries, location.origin)], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'itch-live-css-claves.txt' });
    a.click();
    URL.revokeObjectURL(url);
  }

  // the three actions on the encrypted copy: derive (slow on purpose), call, say what happened
  async function run(action, okId, needsKeys) {
    if (needsKeys && password.length < MIN_PASSWORD) return setStatus({ id: 'keys.shortPassword', params: { min: MIN_PASSWORD } });
    setBusy(true);
    setStatus({ id: 'keys.working' });
    try {
      const got = await action(email, password);
      if (got) setEntries(got);
      setStatus({ id: okId, params: { count: got?.length } });
    } catch (err) {
      setStatus(err.message === 'notFound' ? { id: 'keys.notFound' } : { id: 'keys.failed', params: { error: err.message } });
    } finally {
      setBusy(false);
    }
  }
  const submit = (ev) => {
    ev.preventDefault();
    run(keychain.backup, 'keys.backedUp', true);
  };

  return (
    <>
      <Navbar current="/claves" />
      <Page>
        <Title>{t('keys.title')}</Title>
        <p className="mt-4 max-w-[72ch] text-muted-foreground">{t('keys.intro')}</p>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle><h2>{t('keys.browserTitle')}</h2></CardTitle>
            <CardDescription>{t('keys.browserText')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {entries.length === 0 ? (
              <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{t('keys.empty')}</p>
            ) : (
              <ul className="list-none space-y-3 p-0">
                {entries.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-end gap-2">
                    <div className="grid min-w-48 flex-1 gap-1.5">
                      <Label htmlFor={`name-${e.id}`}>{e.page ? t(`pageNames.${e.page}`) : t('keys.unknownPage')} · {e.id}</Label>
                      <Input id={`name-${e.id}`} defaultValue={e.name} placeholder={t('keys.namePlaceholder')} maxLength={60}
                        onBlur={(ev) => setEntries(keychain.rename(e.id, ev.target.value.trim()))} />
                    </div>
                    <Button asChild size="sm"><a href={`/#edit=${e.id}.${e.key}`}>{t('keys.open')}</a></Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEntries(keychain.forget(e.id))}>{t('keys.forget')}</Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" disabled={entries.length === 0} onClick={download}>{t('keys.download')}</Button>
              <Button asChild variant="outline" size="sm">
                <label>{t('keys.importFile')}<input type="file" accept=".txt,text/plain" className="sr-only" onChange={importFile} /></label>
              </Button>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="pasted">{t('keys.pasteLabel')}</Label>
              <Textarea id="pasted" rows={3} value={pasted} onChange={(e) => setPasted(e.target.value)} />
              <div>
                <Button type="button" size="sm" variant="outline" disabled={!pasted.trim()} onClick={() => { add(keychain.parseText(pasted)); setPasted(''); }}>{t('keys.pasteAdd')}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle><h2>{t('keys.copyTitle')}</h2></CardTitle>
            <CardDescription><Inline text={t('keys.copyText')} /></CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid max-w-md gap-4" onSubmit={submit}>
              <div className="grid gap-1.5">
                <Label htmlFor="keys-email">{t('keys.email')}</Label>
                <Input id="keys-email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="keys-password">{t('keys.password', { min: MIN_PASSWORD })}</Label>
                <Input id="keys-password" type="password" autoComplete="off" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <p className="text-sm text-muted-foreground">{t('keys.noReset')}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={busy || entries.length === 0}>{t('keys.backup')}</Button>
                <Button type="button" variant="outline" disabled={busy || !email || !password}
                  onClick={() => run(keychain.restore, 'keys.restored', false)}>{t('keys.restore')}</Button>
                <Button type="button" variant="ghost" disabled={busy || !email || !password}
                  onClick={() => run(keychain.deleteBackup, 'keys.deleted', false)}>{t('keys.deleteCopy')}</Button>
              </div>
            </form>
            <p role="status" className="mt-4 min-h-6 text-sm text-muted-foreground">{status && t(status.id, status.params)}</p>
          </CardContent>
        </Card>
      </Page>
    </>
  );
}
