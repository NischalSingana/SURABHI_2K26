import { getCategories } from "@/actions/events.action";
import Loader from "@/components/ui/Loader";
import CompetitionsClient, {
  type CategoryData,
} from "./CompetitionsClient";

export default async function CompetitionsPage() {
  const result = await getCategories(false);

  if (!result.success || !result.data) {
    return <Loader />;
  }

  const categories: CategoryData[] = result.data
    .map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      count: cat.Event.length,
      image:
        cat.image ||
        (cat.Event.length > 0 ? cat.Event[0].image : "/placeholder.png"),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return <CompetitionsClient initialCategories={categories} />;
}
