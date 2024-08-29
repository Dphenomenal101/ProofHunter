"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";

export default function Component() {
  const [logo, setLogo] = useState<string | null>(null);
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setIsLoading(true);

    const DEBUG_MODE = false;

    fetch(`/api/proof${DEBUG_MODE ? "?debug=true" : ""}`, {
      method: "POST",
      body: formData,
    })
      .then(async (res) => {
        const data = await res.json();
        const ogImageUrl = data.ogImageUrl;
        setOgImageUrl(ogImageUrl);
      })
      .catch((e) => {
        alert(e);
        console.error(e);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-6">
      <div className="flex flex-col items-center">
        <Label htmlFor="logo-upload" className="block mb-2">
          Current Logo
        </Label>
        {logo ? (
          <Image
            src={logo}
            alt="Uploaded logo"
            width={500}
            height={100}
            className="mb-4"
          />
        ) : (
          <Image
            src="/logo.png"
            alt="ProofHunter Logo"
            width={500}
            height={100}
            className="mb-4"
          />
        )}
        <Input
          type="file"
          name="logo"
          accept="image/*"
          onChange={handleLogoUpload}
          className="w-full"
          required
        />
      </div>

      <Label htmlFor="product-hunt-link" className="block mb-2">
        Product Hunt link
      </Label>
      <Input
        type="text"
        placeholder="https://producthunt.com/products/product-name/"
        name="link"
        className="w-full"
        required
      />

      <Label htmlFor="bg-color" className="block mb-2">
        Background color
      </Label>
      <Input
        type="color"
        defaultValue="#F97316"
        name="bg-color"
        className="w-full h-10"
        required
      />

      <Label htmlFor="brand-color" className="block mb-2">
        Brand color
      </Label>
      <Input
        type="color"
        defaultValue="#18181B"
        name="brand-color"
        className="w-full h-10"
        required
      />

      <div className="inline-flex self-start items-center">
        <Input type="checkbox" name="invert-colors" className="h-4 w-4 mr-2" />
        <Label htmlFor="invert-colors">Invert text and icons color</Label>
      </div>

      {ogImageUrl && (
        <>
          <a href={ogImageUrl} download>
            <Image
              src={ogImageUrl}
              width={940}
              height={788}
              alt="OG Image"
              className="w-full"
            />
          </a>
          <p className="text-center text-sm text-black/50 underline">
            Click the image to download
          </p>
        </>
      )}

      <Button className="w-full" type="submit" loading={isLoading}>
        Generate Social Proof
      </Button>
    </form>
  );
}
