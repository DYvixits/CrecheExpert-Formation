import { useState } from 'react'
import { Page, PageHeader, PageTitle, PageDescription, PageBody, DataTable, Card, CardContent, CardHeader, CardTitle, Badge, Button, Input, SearchInput, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, EmptyState } from '@blinkdotnew/ui'
import { GraduationCap, ShieldCheck, Search, Filter, ArrowRight, Star, Clock, Globe } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { blink } from '../blink/client'
import { type ColumnDef } from '@tanstack/react-table'

interface Training {
  id: string
  title: string
  description: string
  providerName: string
  duration: string
  format: string
  labels: string
  category: string
  objective: string
}

export default function CatalogPage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('all')

  const { data: trainings, isLoading } = useQuery({
    queryKey: ['trainings', category],
    queryFn: async () => {
      const filters: any = {}
      if (category !== 'all') filters.category = category
      return await blink.db.training_catalog.list({ where: filters }) as Training[]
    }
  })

  const filteredTrainings = trainings?.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.providerName.toLowerCase().includes(search.toLowerCase())
  )

  const columns: ColumnDef<Training>[] = [
    {
      accessorKey: 'title',
      header: 'Formation',
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5 max-w-[300px]">
          <span className="font-bold text-base leading-tight">{row.original.title}</span>
          <span className="text-xs text-muted-foreground line-clamp-1">{row.original.objective}</span>
        </div>
      )
    },
    {
      accessorKey: 'providerName',
      header: 'Organisme',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider h-5 flex items-center justify-center bg-secondary font-bold border-secondary text-primary">
            Qualiopi
          </Badge>
          <span className="text-sm font-medium">{row.original.providerName}</span>
        </div>
      )
    },
    {
      accessorKey: 'duration',
      header: 'Durée',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{row.original.duration}</span>
        </div>
      )
    },
    {
      accessorKey: 'labels',
      header: 'Labels & Financements',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.labels.split(',').map(label => (
            <Badge key={label} variant="secondary" className="text-[10px] uppercase font-bold text-primary/80 bg-primary/10 border-transparent">
              {label.trim()}
            </Badge>
          ))}
        </div>
      )
    },
    {
      id: 'actions',
      cell: () => (
        <Button variant="ghost" size="icon" className="hover:text-primary hover:bg-primary/5">
          <ArrowRight className="w-4 h-4" />
        </Button>
      )
    }
  ]

  return (
    <Page className="animate-fade-in">
      <PageHeader>
        <div className="flex flex-col gap-1">
          <PageTitle>Catalogue de Formations</PageTitle>
          <PageDescription>
            Toutes les formations certifiantes et obligatoires référencées pour 2026.
          </PageDescription>
        </div>
      </PageHeader>

      <PageBody className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Rechercher une formation, un organisme..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-lg h-12 rounded-xl shadow-sm border-border/60"
            />
          </div>
          <div className="flex gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[200px] h-12 rounded-xl shadow-sm border-border/60">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="Regulatory">Réglementaire</SelectItem>
                <SelectItem value="Educational">Pédagogie</SelectItem>
                <SelectItem value="Management">Management</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredTrainings && filteredTrainings.length > 0 ? (
          <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-white">
            <DataTable
              columns={columns}
              data={filteredTrainings}
              loading={isLoading}
              className="border-none"
            />
          </div>
        ) : !isLoading ? (
          <EmptyState
            icon={<GraduationCap />}
            title="Aucune formation trouvée"
            description="Essayez d'ajuster vos critères de recherche ou de changer de catégorie."
            action={{ label: "Réinitialiser les filtres", onClick: () => { setSearch(''); setCategory('all'); } }}
          />
        ) : (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        )}
      </PageBody>
    </Page>
  )
}
