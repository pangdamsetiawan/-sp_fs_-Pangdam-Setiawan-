'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link'; // ✅ Tambahkan ini
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button'; // ✅ Untuk tombol kembali

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

  useEffect(() => {
    if (projectId) fetchTasks();
  }, [projectId]);

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
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* ✅ Tombol kembali */}
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects/${projectId}`}>← Kembali ke Proyek</Link>
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-4">📊 Statistik Tugas Proyek</h1>

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
            <Pie data={chartData} />
            <div className="mt-4 text-sm text-muted-foreground">
              <ul className="list-disc list-inside">
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
