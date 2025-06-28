// Lokasi: src/app/projects/[projectId]/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link'; // Import Link untuk navigasi
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // Import Button
import { ArrowLeft } from 'lucide-react'; // Import ikon (pastikan lucide-react terinstal)

ChartJS.register(ArcElement, Tooltip, Legend);

type Task = {
  id: string;
  status: 'todo' | 'in-progress' | 'done';
};

export default function ProjectAnalyticsPage() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Definisikan fungsi fetch di dalam useEffect
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/${projectId}/tasks`);
        if (!res.ok) throw new Error('Gagal memuat data tugas');
        const data = await res.json();
        setTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchTasks();
    }
  }, [projectId]); // Hanya projectId yang menjadi dependensi

  const statusCount = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  const chartData = {
    labels: ['To Do', 'In Progress', 'Done'],
    datasets: [
      {
        data: [statusCount.todo, statusCount.inProgress, statusCount.done],
        backgroundColor: ['#facc15', '#38bdf8', '#4ade80'],
        borderColor: '#1e293b', // Warna border gelap agar terlihat
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* ++ TOMBOL KEMBALI DAN JUDUL ++ */}
      <div className="flex items-center gap-4 mb-4">
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">📊 Statistik Tugas Proyek</h1>
      </div>

      {isLoading ? (
        <p>Memuat data...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status Tugas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-xs mx-auto">
              <Pie data={chartData} />
            </div>
            <div className="mt-6 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-2">
                <li>📝 To Do: {statusCount.todo}</li>
                <li>⏳ In Progress: {statusCount.inProgress}</li>
                <li>✅ Done: {statusCount.done}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
