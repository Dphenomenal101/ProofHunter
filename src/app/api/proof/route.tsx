/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { firecrawl } from "@/lib/firecrawl";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const data = await request.formData();

  const debug = request.nextUrl.search === "?debug=true";

  const file = data.get("logo") as Blob;
  const productHuntLink = data.get("link") as string;
  const backgroundColor = data.get("bg-color") as string;
  const brandColor = data.get("brand-color") as string;
  const invertColors = (data.get("invert-colors") as string) === "on";

  const normalFontData = await fetch(
    new URL(
      "../../../../assets/fonts/poppins/poppinsregular.ttf",
      import.meta.url
    )
  ).then((res) => res.arrayBuffer());

  const boldFontData = await fetch(
    new URL("../../../../assets/fonts/poppins/poppinsbold.ttf", import.meta.url)
  ).then((res) => res.arrayBuffer());

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type.match(/image\//) === null) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 415 });
  }

  if (
    new URL(productHuntLink).hostname.match(/producthunt\.com$/) === null &&
    new URL(productHuntLink).pathname.match(/^\/products\/.+/) === null
  ) {
    return NextResponse.json(
      { error: "Invalid Product Hunt link" },
      { status: 400 }
    );
  }

  if (
    backgroundColor.match(/^#[0-9a-f]{6}$/) === null ||
    brandColor.match(/^#[0-9a-f]{6}$/) === null
  ) {
    return NextResponse.json(
      { error: "Invalid brand colors" },
      { status: 400 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let review: {
    name: string;
    profilePicture: string;
    username: string;
    rating: number;
    review: string;
  };
  let reviewProfilePicture: string;

  if (debug) {
    review = {
      name: "Frederick Johnson",
      profilePicture:
        "https://ph-avatars.imgix.net/2627331/23ab1561-ea49-49b0-9d7b-bfb46b047087.jpeg",
      username: "@rayaneb",
      rating: 5,
      review:
        "This is a great product! It's easy to use and has a lot of features. I highly recommend it! This is a great product! It's easy to use and has a lot of features. I highly recommend it! This is a great product! It's easy to use and has a lot of features. I highly recommend it!",
    };

    reviewProfilePicture = review.profilePicture;
  } else {
    // Scrape the product hunt link for a good review
    const reviewsLink =
      productHuntLink[productHuntLink.length - 1] === "/"
        ? productHuntLink + "reviews?rating=5"
        : `${productHuntLink}/reviews?rating=5`;

    const scrapingData = await firecrawl.scrapeUrl(reviewsLink, {
      scrapeOptions: {
        waitFor: 1000,
      },
      extractorOptions: {
        extractionSchema: {
          type: "object",
          properties: {
            name: { type: "string" },
            profilePicture: { type: "string" },
            username: { type: "string" },
            rating: { type: "number" },
            review: { type: "string" },
          },
          required: ["name", "username", "rating", "review"],
        },
        extractionPrompt: `Extract the following information from a good review from the page:
      - Name of the reviewer
      - Their profile picture image link
      - Their username (starts with an @ in the href)
      - Rating (only 5 star ratings)
      - Review (the review itself)
    The review shouldn't be too long.
    `,
      },
      waitFor: 1000,
      timeout: 10000,
    });

    if (!scrapingData.data?.llm_extraction) {
      return NextResponse.json({ error: "No review found" }, { status: 404 });
    }

    review = scrapingData.data.llm_extraction as {
      name: string;
      profilePicture: string;
      username: string;
      rating: number;
      review: string;
    };

    reviewProfilePicture =
      new URL(review.profilePicture).origin +
      new URL(review.profilePicture).pathname;
  }

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          fontSize: 40,
          background: backgroundColor,
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            paddingLeft: 40,
            paddingRight: 40,
            width: "100%",
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <img
            src={`data:${file.type};base64,${buffer.toString("base64")}`}
            alt="Uploaded Image"
            style={{
              maxWidth: "100%",
              maxHeight: "70px",
              objectFit: "contain",
              alignSelf: "flex-end",
              marginBottom: -10,
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 50,
              width: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <img
                src={reviewProfilePicture}
                alt="profile picture"
                height={180}
                width={180}
                style={{
                  maxWidth: 180,
                  maxHeight: 180,
                  objectFit: "cover",
                  borderRadius: 200,
                }}
              />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                  paddingLeft: 20,
                }}
              >
                <h1
                  style={{
                    fontSize: 40,
                    fontFamily: '"PoppinsBold"',
                    color: !invertColors ? "#000" : "#fff",
                    margin: 0,
                  }}
                >
                  {review.name}
                </h1>
                <div style={{ display: "flex", flexDirection: "row", gap: 5 }}>
                  {/* Stars */}
                  {Array(review.rating)
                    .fill(0)
                    .map((_, i) => (
                      <svg
                        key={i}
                        width="29"
                        height="25"
                        viewBox="0 0 29 25"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M14.7045 20.0921L23.483 25L21.1534 15.75L28.9091 9.52632L18.696 8.72368L14.7045 0L10.7131 8.72368L0.5 9.52632L8.25568 15.75L5.92614 25L14.7045 20.0921Z"
                          fill={!invertColors ? "black" : "white"}
                        />
                      </svg>
                    ))}
                </div>
              </div>
            </div>
            <div
              style={{
                width: "100%",
                backgroundColor: brandColor,
                borderRadius: 20,
                padding: 40,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <p
                style={{
                  fontSize: 30,
                  fontFamily: '"PoppinsNormal"',
                  color: !invertColors ? "#fff" : "#000",
                  margin: 0,
                  lineHeight: "1.5",
                }}
              >
                {review.review.length > 170
                  ? review.review.slice(0, 170).replace(/\w$/, "") + "..."
                  : review.review}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {/* Product Hunt logo */}
              <svg
                width="30"
                height="30"
                viewBox="0 0 30 30"
                fill="none"
                style={{ marginRight: 20 }}
              >
                <path
                  d="M17.005 10.5H12.7488V15H17.005C17.6017 15 18.174 14.7629 18.596 14.341C19.0179 13.919 19.255 13.3467 19.255 12.75C19.255 12.1533 19.0179 11.581 18.596 11.159C18.174 10.7371 17.6017 10.5 17.005 10.5ZM15 0C6.715 0 0 6.715 0 15C0 23.285 6.715 30 15 30C23.285 30 30 23.285 30 15C30 6.715 23.285 0 15 0ZM17.005 18H12.7488V22.5H9.75125V7.5H17.0062C18.3986 7.50017 19.7339 8.05345 20.7184 9.03813C21.7028 10.0228 22.2558 11.3582 22.2556 12.7506C22.2555 14.143 21.7022 15.4783 20.7175 16.4628C19.7328 17.4472 18.3974 18.0002 17.005 18Z"
                  fill={!invertColors ? "black" : "white"}
                />
              </svg>
              <p
                style={{
                  fontSize: 20,
                  fontFamily: '"PoppinsNormal"',
                  color: !invertColors ? "#000" : "#fff",
                  margin: 0,
                }}
              >
                {review.username}
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 940,
      height: 788,
      fonts: [
        {
          name: "PoppinsNormal",
          data: normalFontData,
          style: "normal",
        },
        {
          name: "PoppinsBold",
          data: boldFontData,
          style: "normal",
        },
      ],
    }
  );

  // Generate a unique URL for the OG image
  const ogImageUrl = `data:${file.type};base64,${Buffer.from(
    await imageResponse.arrayBuffer()
  ).toString("base64")}`;

  // Send the OG image URL back to the client
  return NextResponse.json({ ogImageUrl });
}
