import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Trophy, Star, User, UserCheck, Heart, Bookmark, Calendar, Users, MessageCircle, MapPin, Settings, Building, DollarSign, Shield, Search, Phone, Camera } from "lucide-react";
import { GameifiedProgress as GameifiedProgressType } from "@/hooks/useGameifiedProgress";

interface GameifiedProgressProps {
  progress: GameifiedProgressType;
  showTitle?: boolean;
  compact?: boolean;
}

const iconMap = {
  User,
  UserCheck,
  Heart,
  Bookmark,
  Calendar,
  Users,
  MessageCircle,
  MapPin,
  Settings,
  Building,
  DollarSign,
  Shield,
  Search,
  Phone,
  Camera,
};

export const GameifiedProgress: React.FC<GameifiedProgressProps> = ({ 
  progress, 
  showTitle = true, 
  compact = false 
}) => {
  const { milestones, totalPoints, completedCount, progressPercentage } = progress;

  if (compact) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-3 w-3 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">{totalPoints} pts</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completedCount} of {milestones.length} completed</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        {showTitle && (
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Your KidFun Journey
          </CardTitle>
        )}
        
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">{progressPercentage}%</span>
              <span className="text-sm text-muted-foreground">Complete</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-accent" />
              <span>{totalPoints} points earned</span>
            </div>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            {completedCount}/{milestones.length} milestones
          </Badge>
        </div>
        
        <Progress value={progressPercentage} className="h-3" />
      </CardHeader>
      
      <CardContent className="space-y-3">
        {milestones.map((milestone) => {
          const IconComponent = iconMap[milestone.icon as keyof typeof iconMap] || Circle;
          
          return (
            <div 
              key={milestone.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                milestone.completed 
                  ? 'bg-primary/10 border border-primary/20' 
                  : 'bg-muted/50 hover:bg-muted'
              }`}
            >
              <div className={`flex-shrink-0 ${milestone.completed ? 'text-primary' : 'text-muted-foreground'}`}>
                {milestone.completed ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <IconComponent className="h-5 w-5" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className={`font-medium text-sm ${
                    milestone.completed ? 'text-primary' : 'text-foreground'
                  }`}>
                    {milestone.title}
                  </h4>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-accent" />
                    <span className="text-xs text-accent font-medium">{milestone.points}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{milestone.description}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};