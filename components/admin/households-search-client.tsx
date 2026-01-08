"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { HouseholdSearchResult } from "@/lib/db/repositories/admin"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"

interface Props {
  initialResults: HouseholdSearchResult[]
}

export function HouseholdsSearchClient({ initialResults }: Props) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      setIsSearching(true)
      router.push(`/admin/households?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Households</CardTitle>
        <CardDescription>Search by household ID or parent email</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            placeholder="Search by household ID or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
            disabled={isSearching}
          />
          <Button type="submit" disabled={isSearching}>
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </form>

        {isSearching ? (
          <LoadingSkeleton count={5} height={60} />
        ) : initialResults.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No households found</EmptyTitle>
              <EmptyDescription>Try adjusting your search criteria or search for a different term</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Household ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Children</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialResults.map((household) => (
                  <TableRow key={household.id}>
                    <TableCell className="font-mono text-xs">{household.id.slice(0, 8)}...</TableCell>
                    <TableCell>{household.name}</TableCell>
                    <TableCell>
                      <Badge variant={household.status === "active" ? "default" : "secondary"}>
                        {household.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{household.child_count}</TableCell>
                    <TableCell>{new Date(household.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {household.last_activity ? new Date(household.last_activity).toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/households/${household.id}`}>
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
