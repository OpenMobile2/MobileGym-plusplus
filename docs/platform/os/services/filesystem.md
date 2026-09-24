# FileSystem Service

The simulator exposes a virtual filesystem rooted at Android-like paths such as:

```text
/sdcard/Documents
/sdcard/Pictures
/sdcard/Download
```

Apps should use `FileSystemService`; benchmark/debug code can use `__SIM_FS__`.

```ts
import * as FileSystem from '@/os/FileSystemService';

await FileSystem.writeFile('/sdcard/Documents/report.txt', 'hello', { mimeType: 'text/plain' });
const blob = await FileSystem.readFile('/sdcard/Documents/report.txt');
FileSystem.listDirectory('/sdcard/Documents');
await FileSystem.deleteNode('/sdcard/Documents/report.txt');
```

The backing store may be persisted or volatile depending on build/test setup. Treat files as simulator state, not browser downloads.

See the service index for broader context: [README.md](README.md).
