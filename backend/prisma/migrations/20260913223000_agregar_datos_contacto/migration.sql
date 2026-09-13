-- AlterTable
ALTER TABLE "Persona" ADD COLUMN     "correoElectronico" TEXT NOT NULL,
ADD COLUMN     "telefono" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Persona_correoElectronico_key" ON "Persona"("correoElectronico");

