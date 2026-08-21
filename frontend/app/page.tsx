import { UploadForm } from "@/components/upload-form";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Pajak-Cek</h1>
        <p className="max-w-md text-muted-foreground">
          Upload faktur pajak untuk ekstraksi data otomatis dan pemeriksaan kepatuhan
          terhadap regulasi PPN terbaru.
        </p>
      </div>

      <div className="mt-10 flex w-full justify-center">
        <UploadForm />
      </div>
    </div>
  );
}
