'use client';

import { useState, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react'; // Import ikon ArrowLeft

// Komponen UI dari Shadcn
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';


// Tipe data
type Project = { id: string; name: string };
type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assignee?: { id: string; email: string } | null;
};

// Komponen Kartu Tugas
function TaskCard({ task, onEdit, onDeleteTrigger }: { task: Task, onEdit: (task: Task) => void, onDeleteTrigger: (task: Task) => void }) {
  return (
    <div
      className="p-4 bg-background rounded-lg border shadow-sm mb-2 cursor-grab active:cursor-grabbing"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
    >
      <h3 className="font-semibold">{task.title}</h3>
      {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
      {task.assignee?.email && <p className="text-sm text-muted-foreground mt-1">👤 {task.assignee.email}</p>}
      <div className="flex gap-2 mt-3">
        <button onClick={() => onEdit(task)} className="text-sm text-blue-600 hover:underline">Edit</button>
        <button onClick={() => onDeleteTrigger(task)} className="text-sm text-red-600 hover:underline">Delete</button>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State untuk dialog dan form
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: ''});
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const fetchProjectData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [projectRes, tasksRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/projects/${projectId}/tasks`),
      ]);
      if (!projectRes.ok) throw new Error('Gagal memuat proyek');
      if (!tasksRes.ok) throw new Error('Gagal memuat tugas');
      const projectData = await projectRes.json();
      const tasksData = await tasksRes.json();
      setProject(projectData);
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchProjectData();
  }, [projectId]);

  const handleCreateTask = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newTask, status: 'todo' }),
      });
      setNewTask({ title: '', description: '' });
      setIsTaskDialogOpen(false);
      await fetchProjectData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const handleEditTaskSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTask) return;
    const res = await fetch(`/api/projects/${projectId}/tasks/${editTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editTask.title, description: editTask.description, status: editTask.status }),
    });
    if (res.ok) {
      setIsEditDialogOpen(false);
      setEditTask(null);
      await fetchProjectData();
    } else {
      alert('Gagal memperbarui task');
    }
  };
  
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    await fetch(`/api/projects/${projectId}/tasks/${taskToDelete.id}`, { method: 'DELETE' });
    setTaskToDelete(null);
    await fetchProjectData();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    try {
      await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchProjectData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan');
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
        const response = await fetch(`/api/projects/${projectId}/export`);
        if (!response.ok) throw new Error('Gagal mengekspor data');
        const blob = await response.blob();
        const contentDisposition = response.headers.get('content-disposition');
        let fileName = 'project-export.json';
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
            if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
        }
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat ekspor');
    } finally {
        setIsExporting(false);
    }
  };

  const statusLabels = { todo: '📝 To Do', 'in-progress': '⏳ In Progress', done: '✅ Done' };
  const statuses = ['todo', 'in-progress', 'done'];

  if (isLoading) return <div className="p-8">Memuat papan tugas...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* ++ HEADER DENGAN TOMBOL KEMBALI (DIPERBARUI) ++ */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">{project?.name || 'Detail Proyek'}</h1>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-muted-foreground">Kelola semua tugas Anda di sini.</p>
        <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Mengekspor...' : '📥 Ekspor'}
           </Button>
           <Button variant="outline" size="sm" asChild>
             <Link href={`/projects/${projectId}/analytics`}>📊 Statistik</Link>
           </Button>
           <Button variant="outline" size="sm" asChild>
             <Link href={`/projects/${projectId}/settings`}>⚙️ Pengaturan</Link>
           </Button>
        </div>
      </div>

      {/* Tambah Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6">+ Tambah Task</Button>
        </DialogTrigger>
        <DialogContent>
          <form onSubmit={handleCreateTask}>
            <DialogHeader>
              <DialogTitle>Tambah Task Baru</DialogTitle>
              <DialogDescription>Task akan muncul di kolom To Do.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="title">Judul</Label>
              <Input id="title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} required />
              <Label htmlFor="desc">Deskripsi</Label>
              <Input id="desc" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} />
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

      {/* Edit Task Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <form onSubmit={handleEditTaskSubmit}>
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>Perbarui data task.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Label htmlFor="edit-title">Judul</Label>
              <Input
                id="edit-title"
                value={editTask?.title || ''}
                onChange={(e) => setEditTask(prev => prev ? { ...prev, title: e.target.value } : null)}
                required
              />
              <Label htmlFor="edit-desc">Deskripsi</Label>
              <Input
                id="edit-desc"
                value={editTask?.description || ''}
                onChange={(e) => setEditTask(prev => prev ? { ...prev, description: e.target.value } : null)}
              />
              <Label htmlFor="edit-status">Status</Label>
              <select
                id="edit-status"
                value={editTask?.status || 'todo'}
                onChange={(e) => setEditTask(prev => prev ? { ...prev, status: e.target.value } : null)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="todo">📝 To Do</option>
                <option value="in-progress">⏳ In Progress</option>
                <option value="done">✅ Done</option>
              </select>
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

      {/* Kanban Board */}
      <DndContext sensors={sensors}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statuses.map(status => (
            <div
              key={status}
              className="bg-muted/50 p-4 rounded-lg min-h-[300px]"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, status)}
            >
              <h2 className="font-semibold mb-4 text-center">
                {statusLabels[status as keyof typeof statusLabels]} (
                {tasks.filter(t => t.status === status).length})
              </h2>
              {tasks.filter(t => t.status === status).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={(t) => {
                    setEditTask(t);
                    setIsEditDialogOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          ))}
        </div>
      </DndContext>
    </div>
  );
}
