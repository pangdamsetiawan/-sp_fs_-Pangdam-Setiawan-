// Lokasi: src/app/dashboard/page.tsx
'use client';

import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

// Mendefinisikan tipe data untuk sebuah proyek
type Project = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State untuk form proyek baru di dalam dialog
  const [newProjectName, setNewProjectName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fungsi untuk mengambil daftar proyek dari API
  const fetchProjects = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const res = await fetch('/api/projects');
      if (!res.ok) {
        // Coba baca pesan error dari server
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal mengambil data proyek');
      }
      const data = await res.json();
      setProjects(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Terjadi kesalahan yang tidak diketahui');
    } finally {
      setIsLoading(false);
    }
  };

  // Jalankan fetchProjects() saat halaman pertama kali dimuat
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fungsi untuk menangani pembuatan proyek baru
  const handleCreateProject = async (event: FormEvent) => {
    event.preventDefault();
    if (!newProjectName) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProjectName }),
      });
      if (!res.ok) throw new Error('Gagal membuat proyek baru');
      
      setIsDialogOpen(false);
      setNewProjectName('');
      await fetchProjects();

    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert('Terjadi kesalahan');
    }
  };

  if (isLoading) return <div className="p-8">Loading proyek...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard Proyek Anda</h1>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Buat Proyek Baru</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleCreateProject}>
              <DialogHeader>
                <DialogTitle>Buat Proyek Baru</DialogTitle>
                <DialogDescription>
                  Beri nama proyek baru Anda. Klik simpan jika sudah selesai.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nama
                  </Label>
                  <Input
                    id="name"
                    value={newProjectName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewProjectName(e.target.value)}
                    className="col-span-3"
                    required
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Batal</Button>
                </DialogClose>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
             <Link href={`/projects/${project.id}`} key={project.id}>
                <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground cursor-pointer hover:bg-muted/50 transition-colors h-full">
                  <h2 className="text-xl font-semibold">{project.name}</h2>
                  <p className="text-sm text-muted-foreground mt-2">Project ID: {project.id}</p>
                </div>
              </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 border-2 border-dashed rounded-lg mt-6">
          <p className="font-semibold">Anda belum memiliki proyek.</p>
          <p className="text-sm text-muted-foreground">Klik tombol Buat Proyek Baru untuk memulai.</p>
        </div>
      )}
    </div>
  );
}
