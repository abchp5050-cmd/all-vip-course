import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Users, Clock, TrendingUp } from "lucide-react"
import { TelegramShareButton } from "./telegram-share-button"

interface CourseCardProps {
  id: string
  title: string
  description: string
  category: string
  instructor: string
  rating: number
  students: number
  price: number
  image?: string
  level: "Beginner" | "Intermediate" | "Advanced"
  duration: string
  trending?: boolean
  userId?: string // added userId for Telegram sharing
  showTelegramShare?: boolean // added flag to show telegram button
}

export function CourseCard({
  id,
  title,
  description,
  category,
  instructor,
  rating,
  students,
  price,
  image,
  level,
  duration,
  trending,
  userId = "default-user", // default userId
  showTelegramShare = false, // default flag
}: CourseCardProps) {
  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Image Section */}
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20 overflow-hidden">
        {image ? (
          <img
            src={image || "/placeholder.svg"}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-5xl opacity-50">📚</div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          {trending && (
            <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Trending
            </Badge>
          )}
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            {level}
          </Badge>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        {/* Category */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 flex-1">
          <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>

        {/* Instructor */}
        <div className="text-sm text-muted-foreground">
          By <span className="font-medium text-foreground">{instructor}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t border-border pt-4">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="font-medium">{rating}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            <span>{(students / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
        </div>

        {/* Footer with Price and Button */}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <div className="text-xl font-bold text-primary">${price}</div>
          <div className="flex gap-2">
            {showTelegramShare && <TelegramShareButton courseId={id} courseTitle={title} userId={userId} />}
            <Button size="sm" className="flex-1">
              Enroll
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}
