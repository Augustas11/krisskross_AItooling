# KrissKross CRM Environment Variables Template

Copy this file to `.env.local` and fill in your actual values.

## Required for Supabase (Cloud Storage)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Get these from: https://app.supabase.com/project/_/settings/api

## Required for AI Pitch Generation

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Get your API key from: https://console.anthropic.com/

## Notes

- Without Supabase credentials, the app will use file-based storage (leads_db.json)
- File-based storage works but data may be lost on deployment or server restart
- Supabase provides cloud-based persistence and is recommended for production use

See `docs/SUPABASE_SETUP.md` for detailed setup instructions.
