# Administrator dashboard

Copy `admin-config.example.bat` to `admin-config.bat`, then set the administrator username and password:

```bat
set "RHYTHMTOUCH_ADMIN_USERNAME=your-username"
set "RHYTHMTOUCH_ADMIN_PASSWORD=your-password"
```

Do not share these credentials with participants.

Start the server and open:

```text
http://localhost:3000/admin
```

The dashboard provides read-only access to participant progress, task outcomes, similarity scores, and raw database records. Records can be filtered by participant or presented block number and exported as CSV.
