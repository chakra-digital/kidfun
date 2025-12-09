import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Circle, Trophy, Star, User, UserCheck, Heart, Bookmark, Calendar, Users, MessageCircle, MapPin, Settings, Building, DollarSign, Shield, Search, Phone, Camera, ChevronDown, ChevronUp, ChevronRight } from "lucide-react";
import { GameifiedProgress as GameifiedProgressType } from "@/hooks/useGameifiedProgress";

interface GameifiedProgressProps {
  progress: GameifiedProgressType;
  showTitle?: boolean;
  compact?: boolean;
  defaultExpanded?: boolean;
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
  compact = false,
  defaultExpanded = true
}) => {
  const { milestones, totalPoints, completedCount, progressPercentage } = progress;
  const [expanded, setExpanded] = useState(defaultExpanded);
  const navigate = useNavigate();

  const handleMilestoneClick = (milestone: typeof milestones[0]) => {
    if (!milestone.completed && milestone.actionLink) {
      navigate(milestone.actionLink);
    }
  };

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
              <span>{Math.round(progressPercentage)}%</span>
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
              <span className="text-2xl font-bold text-primary">{Math.round(progressPercentage)}%</span>
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-center gap-2 mt-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide milestones
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show milestones
            </>
          )}
        </Button>
      </CardHeader>
      
      {expanded && (
        <CardContent className="space-y-3">
          {milestones.map((milestone) => {
            const IconComponent = iconMap[milestone.icon as keyof typeof iconMap] || Circle;
            const isClickable = !milestone.completed && milestone.actionLink;
            
            return (
              <div 
                key={milestone.id}
                onClick={() => handleMilestoneClick(milestone)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  milestone.completed 
                    ? 'bg-primary/10 border border-primary/20' 
                    : isClickable
                    ? 'bg-muted/50 hover:bg-muted cursor-pointer'
                    : 'bg-muted/50'
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

                {isClickable && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>
            );
          })}
        </CardContent>
      )}
    </Card>
  );
};