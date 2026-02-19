CREATE TABLE "event" (
	"id" serial PRIMARY KEY NOT NULL,
	"year" varchar(4) NOT NULL,
	"min_capacity" integer NOT NULL,
	"max_capacity" integer NOT NULL,
	"cod" varchar(255) NOT NULL,
	"duration" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	CONSTRAINT "event_cod_unique" UNIQUE("cod")
);
--> statement-breakpoint
CREATE TABLE "inscription" (
	"idStudent" integer NOT NULL,
	"idEvent" integer NOT NULL,
	CONSTRAINT "inscription_pkey" PRIMARY KEY("idStudent","idEvent")
);
--> statement-breakpoint
CREATE TABLE "student" (
	"id" serial PRIMARY KEY NOT NULL,
	"legajo" varchar(255) NOT NULL,
	"doc" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"lastname" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_idStudent_student_id_fk" FOREIGN KEY ("idStudent") REFERENCES "public"."student"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscription" ADD CONSTRAINT "inscription_idEvent_event_id_fk" FOREIGN KEY ("idEvent") REFERENCES "public"."event"("id") ON DELETE no action ON UPDATE no action;