import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api.js';
import PageHeader from '../../components/PageHeader.jsx';
import ProjectCard from '../../components/ProjectCard.jsx';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

export default function QRProjects() {
  const { data, isLoading } = useQuery({
    queryKey: ['qr-projects'],
    queryFn: () => api.get('/projects').then((r) => r.data.projects),
  });

  const projects = data || [];

  return (
    <div className="space-y-5">
      <PageHeader title="My Projects" subtitle="Projects assigned to you for review" />

      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : projects.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          No projects assigned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} onClick={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
}
