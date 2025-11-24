-- Add missing foreign key constraint for company_applications
ALTER TABLE user_applications
ADD CONSTRAINT user_applications_application_id_fkey
FOREIGN KEY (application_id) 
REFERENCES company_applications(id) 
ON DELETE CASCADE;