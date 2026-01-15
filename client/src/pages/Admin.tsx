import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { ArrowLeft, Download, Eye, Users, TrendingUp, Calendar } from "lucide-react";
import type { Simulation } from "@shared/schema";

function getScoreColor(score: number | null) {
  if (score === null) return "bg-gray-100 text-gray-800";
  if (score >= 80) return "bg-green-100 text-green-800";
  if (score >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Admin() {
  const { data: simulations, isLoading } = useQuery<Simulation[]>({
    queryKey: ['/api/simulations'],
  });

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/simulations/export');
      const data = await response.json();
      
      const csvRows = [
        ['Name', 'Date', 'Score', 'Strengths', 'Improvements', 'Accuracy Alerts', 'Transcript'].join(',')
      ];
      
      data.forEach((sim: any) => {
        const transcript = sim.transcripts
          ?.map((t: any) => `${t.role === 'user' ? 'Rep' : 'Dr. Hayes'}: ${t.content.replace(/"/g, '""')}`)
          .join(' | ') || '';
        
        const strengths = sim.feedback?.strengths?.join('; ') || '';
        const improvements = sim.feedback?.improvements?.join('; ') || '';
        const alerts = sim.feedback?.incorrectClaims?.join('; ') || '';
        
        csvRows.push([
          `"${sim.userName}"`,
          `"${formatDate(sim.createdAt)}"`,
          sim.score ?? 'N/A',
          `"${strengths}"`,
          `"${improvements}"`,
          `"${alerts}"`,
          `"${transcript}"`
        ].join(','));
      });
      
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-reports-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const completedSimulations = simulations?.filter(s => s.score !== null) || [];
  const avgScore = completedSimulations.length > 0
    ? Math.round(completedSimulations.reduce((sum, s) => sum + (s.score || 0), 0) / completedSimulations.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Training Dashboard</h1>
              <p className="text-gray-600">View all simulation results and performance metrics</p>
            </div>
          </div>
          <Button onClick={handleExportCSV} data-testid="button-export-csv">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Sessions</p>
                  <p className="text-2xl font-bold" data-testid="text-total-sessions">{simulations?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Average Score</p>
                  <p className="text-2xl font-bold" data-testid="text-avg-score">{avgScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-full">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold" data-testid="text-completed">{completedSimulations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : simulations?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No simulations yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-simulations">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Rep Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Score</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulations?.slice().reverse().map((sim) => (
                      <tr key={sim.id} className="border-b hover:bg-gray-50" data-testid={`row-simulation-${sim.id}`}>
                        <td className="py-3 px-4 font-medium">{sim.userName}</td>
                        <td className="py-3 px-4 text-gray-600">{formatDate(sim.createdAt as unknown as string)}</td>
                        <td className="py-3 px-4">
                          {sim.score !== null ? (
                            <Badge className={getScoreColor(sim.score)}>{sim.score}%</Badge>
                          ) : (
                            <Badge variant="outline">—</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {sim.score !== null ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Complete</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">In Progress</Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {sim.score !== null && (
                            <Link href={`/simulation/${sim.id}/results`}>
                              <Button variant="ghost" size="sm" data-testid={`button-view-${sim.id}`}>
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
