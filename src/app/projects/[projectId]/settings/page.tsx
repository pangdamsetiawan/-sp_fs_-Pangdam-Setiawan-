'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { debounce } from 'lodash';
import Link from 'next/link'; // ✅ Tambahkan ini

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

type Member = {
  id: string;
  email: string;
};

type SuggestedUser = {
  id: string;
  email: string;
};

export default function ProjectSettingsPage() {
  const { projectId } = useParams();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      console.error('Gagal mengambil daftar member:', err);
    }
  };

  useEffect(() => {
    if (projectId) fetchMembers();
  }, [projectId]);

  // 🔍 Autocomplete debounce
  const searchUsers = debounce(async (query: string) => {
    if (!query) return setSuggestions([]);

    try {
      const res = await fetch(`/api/users?email=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  }, 300);

  useEffect(() => {
    searchUsers(email);
  }, [email]);

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSending(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Gagal mengundang');

      setMessage(`✅ ${email} berhasil diundang`);
      setEmail('');
      setSuggestions([]);
      await fetchMembers();
    } catch (error) {
      if (error instanceof Error) {
        setMessage(`❌ ${error.message}`);
      } else {
        setMessage('❌ Terjadi kesalahan tak dikenal');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      {/* ✅ Tombol Kembali */}
      <div className="mb-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects/${projectId}`}>← Kembali ke Proyek</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Proyek</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="space-y-4 mb-6 relative">
            <div className="grid gap-2">
              <Label htmlFor="email">Undang Member via Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              {/* 🔽 Autocomplete dropdown */}
              {suggestions.length > 0 && (
                <ul className="absolute top-full left-0 right-0 mt-1 border bg-white rounded shadow max-h-40 overflow-auto text-sm z-50">
                  {suggestions.map((user) => (
                    <li
                      key={user.id}
                      className="px-3 py-1 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setEmail(user.email);
                        setSuggestions([]);
                      }}
                    >
                      {user.email}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="submit" disabled={isSending} className="w-full">
              {isSending ? 'Mengirim Undangan...' : 'Undang Member'}
            </Button>
            {message && (
              <p
                className={`text-sm mt-2 ${
                  message.startsWith('✅') ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message}
              </p>
            )}
          </form>

          <div>
            <h3 className="font-semibold mb-2">👥 Daftar Member:</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {members.length === 0 && <li>Belum ada member</li>}
              {members.map((member) => (
                <li key={member.id}>{member.email}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}