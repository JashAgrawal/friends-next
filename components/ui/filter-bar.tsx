"use client"

import * as React from "react"
import {  useSearchParams } from "next/navigation"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface FilterOption {
  id: string
  name: string
}

export interface FilterCategory {
  id: string
  name: string
  options: FilterOption[]
}

interface FilterBarProps {
  categories: FilterCategory[]
  activeFilters?: Record<string, string[]>
  onFilterChange?: (filters: Record<string, string[]>) => void
}

export function FilterBar({
  categories,
  activeFilters = {},
  onFilterChange,
}: FilterBarProps) {
  const searchParams = useSearchParams()
  const [filters, setFilters] = React.useState<Record<string, string[]>>(activeFilters)
  const [isFilterMenuOpen, setIsFilterMenuOpen] = React.useState(false)

  // Initialize filters from URL on component mount
  React.useEffect(() => {
    const initialFilters: Record<string, string[]> = {}
    
    categories.forEach(category => {
      const param = searchParams.get(category.id)
      if (param) {
        initialFilters[category.id] = param.split(',')
      } else {
        initialFilters[category.id] = []
      }
    })
    
    setFilters(initialFilters)
  }, [searchParams, categories])

  // Update local filters when activeFilters prop changes
  React.useEffect(() => {
    setFilters(activeFilters)
  }, [activeFilters])

  const handleFilterChange = (categoryId: string, optionId: string) => {
    const newFilters = {
      ...filters,
      [categoryId]: optionId ? [optionId] : [], // Single selection per category
    }
    
    setFilters(newFilters)
    
    // Apply filters immediately for desktop view
    if (!isFilterMenuOpen && onFilterChange) {
      onFilterChange(newFilters)
    }
  }

  const applyFilters = () => {
    if (onFilterChange) {
      onFilterChange(filters)
    }
    setIsFilterMenuOpen(false)
  }

  const getSelectedOptionName = (categoryId: string): string => {
    if (!filters[categoryId] || filters[categoryId].length === 0) {
      return "Any"
    }
    
    const selectedOptionId = filters[categoryId][0]
    const option = categories
      .find(c => c.id === categoryId)
      ?.options.find(o => o.id === selectedOptionId)
    
    return option?.name || "Any"
  }

  const clearAllFilters = () => {
    const emptyFilters: Record<string, string[]> = {}
    categories.forEach(category => {
      emptyFilters[category.id] = []
    })
    
    setFilters(emptyFilters)
    
    if (onFilterChange) {
      onFilterChange(emptyFilters)
    }
    
    setIsFilterMenuOpen(false)
  }

  // Count active filters
  const activeFilterCount = Object.values(filters).flat().length

  return (
    <div className="sticky top-16 z-10 bg-black/95 backdrop-blur-sm py-3 border-b border-white/10 mb-6">
      <div className="container flex items-center justify-between">
        {/* Mobile Filter Button */}
        <div className="md:hidden">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
        
        {/* Desktop Filter Categories */}
        <div className="hidden md:flex items-center gap-4">
          {categories.map((category) => (
            <div key={category.id} className="flex flex-col">
              <span className="text-xs text-white/70 uppercase mb-1">{category.name}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="min-w-32 flex justify-between items-center"
                  >
                    <span className="truncate">{getSelectedOptionName(category.id)}</span>
                    <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-gray-900 border-white/10">
                  <DropdownMenuRadioGroup
                    value={filters[category.id]?.[0] || ""}
                    onValueChange={(value) => handleFilterChange(category.id, value)}
                  >
                    <DropdownMenuRadioItem value="" className="text-white">
                      Any
                    </DropdownMenuRadioItem>
                    {category.options.map((option) => (
                      <DropdownMenuRadioItem 
                        key={option.id} 
                        value={option.id}
                        className="text-white"
                      >
                        {option.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
        
        {/* Clear Filters Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hidden md:flex"
            onClick={clearAllFilters}
          >
            Clear Filters
          </Button>
        )}
        
        {/* Mobile Filter Menu */}
        {isFilterMenuOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 md:hidden">
            <div className="bg-gray-900 p-4 max-w-md mx-auto mt-20 rounded-lg border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Filters</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsFilterMenuOpen(false)}
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-6">
                {categories.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <h4 className="text-sm font-medium text-white/70">{category.name}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        key="any"
                        variant={!filters[category.id]?.length ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleFilterChange(category.id, "")}
                      >
                        Any
                      </Button>
                      {category.options.map((option) => (
                        <Button
                          key={option.id}
                          variant={filters[category.id]?.includes(option.id) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleFilterChange(category.id, option.id)}
                        >
                          {option.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </Button>
                )}
                <Button 
                  onClick={applyFilters}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}