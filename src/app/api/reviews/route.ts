import { NextResponse } from "next/server";

const PLACE_ID = "ChIJ179g3CAhV0cRrQOcfltnpgc";

// Oblik odgovora Google Places Details API-ja - samo polja koja stvarno čitamo.
// Sve je opciono jer je to spoljni izvor: ako Google izostavi neko polje,
// hoćemo undefined u JSON-u, ne pad rute.
type GoogleReview = {
  author_name?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  profile_photo_url?: string;
};

type PlaceDetails = {
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: GoogleReview[];
  };
};

export async function GET() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews,rating,user_ratings_total&language=sr&key=${apiKey}`,
    { next: { revalidate: 86400 } } // cache 24h
  );

  const data: PlaceDetails = await res.json();
  const result = data.result || {};

  return NextResponse.json({
    rating: result.rating,
    total: result.user_ratings_total,
    reviews: (result.reviews || []).map((r) => ({
      author: r.author_name,
      rating: r.rating,
      text: r.text,
      time: r.relative_time_description,
      photo: r.profile_photo_url,
    })),
  });
}
