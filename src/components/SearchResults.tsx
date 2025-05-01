import { Person } from "@/apis/apiTypes/response";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { TruncatedText } from "./ui/TruncatedText";

type Props = {
  person: Person;
};

const SearchResults = ({ person }: Props) => {
  const navigate = useNavigate();

  const handleProfileClick = (userId: string) => {
    navigate(`/profile/${userId}`, { state: { fromSearch: true } });
  };

  return (
    <div
      key={person.id}
      className="flex items-center justify-between p-4 hover:bg-accent rounded-lg"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={person.profilePic || person.avatar} alt={person.name} className="h-12 w-12 rounded-full object-cover"/>
          <AvatarFallback className="bg-primary/5 text-primary font-medium">
            {person.name[0]?.toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium">{person.name}</h3>
          <TruncatedText
            text={person.bio} 
            limit={65}
            className="text-sm text-muted-foreground"
            showToggle={false}
          />
        </div>
      </div>
      <div className="flex gap-2 ">
        <Button 
          variant="outline" 
          className="text-foreground border-primary cursor-pointer" 
          onClick={() => handleProfileClick(person.id)}
        >
          View Profile
        </Button>
      </div>
    </div>
  );
};

export default SearchResults;