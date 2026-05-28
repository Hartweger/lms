#!/usr/bin/env python3
import json, urllib.request

SB_URL = "https://rzmyglynjcygsbicssbt.supabase.co"
SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6bXlnbHluamN5Z3NiaWNzc2J0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1NzI1MiwiZXhwIjoyMDkxODMzMjUyfQ.0eOWj0OJwzliA9rYnEd4HkDQS6ngF9fAZZdWy6znT9o"

HEADERS = {
    "apikey": SB_KEY,
    "Authorization": f"Bearer {SB_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

replacements = [
    ('Potrebna vam je', 'Potrebna ti je'),
    ('Ne treba vam', 'Ne treba ti'),
    ('vam ', 'ti '), ('Vam ', 'Ti '),
    ('vaš ', 'tvoj '), ('Vaš ', 'Tvoj '),
    ('vaše ', 'tvoje '), ('vašem ', 'tvom '),
    ('vaših ', 'tvojih '), ('vašim ', 'tvojim '),
    ('vama ', 'tebi '), ('Vama ', 'Tebi '),
    ('dobijate', 'dobijaš'), ('birate', 'biraš'),
    ('možete', 'možeš'), ('koristite', 'koristiš'),
    ('zakazujete', 'zakazuješ'), ('učite', 'učiš'),
    ('pratite', 'pratiš'), ('imate', 'imaš'),
    ('izgovarate', 'izgovaraš'), ('razgovarate', 'razgovaraš'),
    ('kliknite', 'klikni'), ('čujte', 'čuj'),
]

def fix(text):
    for old, new in replacements:
        text = text.replace(old, new)
    return text

# Fetch all purchasable
req = urllib.request.Request(
    f"{SB_URL}/rest/v1/courses?is_purchasable=eq.true&select=slug,marketing_description,features",
    headers=HEADERS
)
data = json.loads(urllib.request.urlopen(req).read())

count = 0
for r in data:
    md = r.get('marketing_description') or ''
    feat = r.get('features') or []

    new_md = fix(md)
    new_feat = [fix(f) for f in feat]

    if new_md != md or new_feat != feat:
        payload = json.dumps({
            'marketing_description': new_md,
            'features': new_feat,
        }, ensure_ascii=False).encode('utf-8')

        patch_req = urllib.request.Request(
            f"{SB_URL}/rest/v1/courses?slug=eq.{r['slug']}",
            data=payload,
            headers=HEADERS,
            method='PATCH'
        )
        urllib.request.urlopen(patch_req)
        count += 1
        print(f"  Updated {r['slug']}")

print(f"\nDone: {count} products updated")
