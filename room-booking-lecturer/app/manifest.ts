import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Room Booking Lecturer",
    short_name: "Room Booking",
    description: "Mobile lecturer app for booking rooms and reporting classroom issues.",
    start_url: "/lecturer/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#5c2c30",
    orientation: "portrait",
    icons: [
      {
        src: "/faculty-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
