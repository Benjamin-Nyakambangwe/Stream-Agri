import { column, Schema, Table } from '@powersync/react-native';

const hr_employee = new Table(
  {
    // id column (text) is automatically included
    resource_id: column.integer,
    company_id: column.integer,
    resource_calendar_id: column.integer,
    message_main_attachment_id: column.integer,
    color: column.integer,
    department_id: column.integer,
    job_id: column.integer,
    address_id: column.integer,
    work_contact_id: column.integer,
    work_location_id: column.integer,
    user_id: column.integer,
    parent_id: column.integer,
    coach_id: column.integer,
    private_state_id: column.integer,
    private_country_id: column.integer,
    country_id: column.integer,
    children: column.integer,
    country_of_birth: column.integer,
    bank_account_id: column.integer,
    distance_home_work: column.integer,
    km_home_work: column.integer,
    departure_reason_id: column.integer,
    create_uid: column.integer,
    write_uid: column.integer,
    name: column.text,
    job_title: column.text,
    work_phone: column.text,
    mobile_phone: column.text,
    work_email: column.text,
    private_street: column.text,
    private_street2: column.text,
    private_city: column.text,
    private_zip: column.text,
    private_phone: column.text,
    private_email: column.text,
    lang: column.text,
    gender: column.text,
    marital: column.text,
    spouse_complete_name: column.text,
    place_of_birth: column.text,
    ssnid: column.text,
    sinid: column.text,
    identification_id: column.text,
    passport_id: column.text,
    permit_no: column.text,
    visa_no: column.text,
    certificate: column.text,
    study_field: column.text,
    study_school: column.text,
    emergency_contact: column.text,
    emergency_phone: column.text,
    distance_home_work_unit: column.text,
    employee_type: column.text,
    barcode: column.text,
    pin: column.text,
    private_car_plate: column.text,
    spouse_birthdate: column.text,
    birthday: column.text,
    visa_expire: column.text,
    work_permit_expiration_date: column.text,
    departure_date: column.text,
    employee_properties: column.text,
    additional_note: column.text,
    notes: column.text,
    departure_description: column.text,
    active: column.integer,
    is_flexible: column.integer,
    is_fully_flexible: column.integer,
    work_permit_scheduled_activity: column.integer,
    create_date: column.text,
    write_date: column.text,
    filter_job_position: column.integer,
    manager_id: column.integer,
    region_id: column.integer,
    employee_code: column.text,
    hourly_cost: column.text,
    timesheet_manager_id: column.integer,
    last_validated_timesheet_date: column.text,
    mobile_app_password: column.text,
    mobile_app_password_salt: column.text
  },
  { indexes: {} }
);

const odoo_gms_grower = new Table(
  {
    // id column (text) is automatically included
    id: column.text,
    timb_grower_id: column.integer,
    create_uid: column.integer,
    write_uid: column.integer,
    grower_number: column.text,
    b010_first_name: column.text,
    b020_surname: column.text,
    b030_national_id: column.text,
    b040_phone_number: column.text,
    latitude: column.text,
    longitude: column.text,
    state: column.text,
    date_of_birth: column.text,
    timb_registration_date: column.text,
    new_update: column.integer,
    create_date: column.text,
    write_date: column.text,
    name: column.text,
    gender: column.text,
    middle_name: column.text,
    grower_image: column.text,
    grower_national_id_image: column.text,
    is_from_mobile: column.integer,
    is_approved: column.integer

  },
  { indexes: {} }
);

const odoo_gms_flags = new Table(
  {
    // id column (text) is automatically included
    create_uid: column.integer,
    write_uid: column.integer,
    name: column.text,
    create_date: column.text,
    write_date: column.text
  },
  { indexes: {} }
);

const odoo_gms_production_scheme = new Table(
  {
    // id column (text) is automatically included
    create_uid: column.integer,
    write_uid: column.integer,
    name: column.text,
    reference: column.text,
    create_date: column.text,
    write_date: column.text,
    production_scheme_category_id: column.integer
  },
  { indexes: {} }
);

const odoo_gms_region = new Table(
  {
    // id column (text) is automatically included
    province_id: column.integer,
    supervisor_id: column.integer,
    create_uid: column.integer,
    write_uid: column.integer,
    name: column.text,
    reference: column.text,
    create_date: column.text,
    write_date: column.text,
    parent_id: column.integer
  },
  { indexes: {} }
);

const odoo_gms_distribution_plan = new Table(
  {
    // id column (text) is automatically included
    production_cycle_id: column.integer,
    production_scheme_id: column.integer,
    activity_id: column.integer,
    price_list_id: column.integer,
    province_id: column.integer,
    region_id: column.integer,
    create_uid: column.integer,
    write_uid: column.integer,
    create_date: column.text,
    write_date: column.text
  },
  { indexes: {} }
);

const odoo_gms_activity = new Table(
  {
    // id column (text) is automatically included
    unit_of_scale_id: column.integer,
    create_uid: column.integer,
    write_uid: column.integer,
    name: column.text,
    reference: column.text,
    create_date: column.text,
    write_date: column.text
  },
  { indexes: {} }
);

const odoo_gms_production_cycle = new Table(
  {
    // id column (text) is automatically included
    activity_id: column.integer,
    create_uid: column.integer,
    write_uid: column.integer,
    name: column.text,
    reference: column.text,
    create_date: column.text,
    write_date: column.text
  },
  { indexes: {} }
);

const odoo_gms_production_cycle_registration = new Table(
  {
    // id column (text) is automatically included
    production_scheme_id: column.integer,
    production_cycle_id: column.integer,
    grower_id: column.integer,
    region_id: column.integer,
    activity_id: column.integer,
    field_technician_id: column.integer,
    supervisor_id: column.integer,
    overseer_id: column.integer,
    create_uid: column.integer,
    write_uid: column.integer,
    timb_first_name: column.text,
    timb_surname: column.text,
    timb_name: column.text,
    grower_name: column.text,
    mobile: column.text,
    black_white_listed_state: column.text,
    contracted_state: column.text,
    state: column.text,
    timb_status: column.integer,
    correct_info: column.integer,
    wrong_grower: column.integer,
    whitelist_upload: column.integer,
    new_update: column.integer,
    create_date: column.text,
    write_date: column.text,
    b010_contract_scale: column.real,
    b020_contracted_yield: column.real,
    b030_contracted_volume: column.real,
    b040_contracted_price: column.real,
    b050_contracted_return: column.real,
    b060_estimated_scale: column.real,
    b070_estimated_yield: column.real,
    b080_estimated_volume: column.real,
    b090_estimated_price: column.real,
    b100_estimated_return: column.real,
    loan_amount: column.real,
    paid_amount: column.real,
    first_name: column.text,
    surname: column.text,
    distribution_plan: column.integer,
    balance: column.real,
    production_cycle_name: column.text
  },
  { indexes: {} }
);

export const AppSchema = new Schema({
  hr_employee,
  odoo_gms_grower,
  odoo_gms_flags,
  odoo_gms_production_scheme,
  odoo_gms_region,
  odoo_gms_distribution_plan,
  odoo_gms_activity,
  odoo_gms_production_cycle,
  odoo_gms_production_cycle_registration
});


// For types
export type Database = (typeof AppSchema)['types'];
export type EmployeeRecord = Database['hr_employee'];
export type GrowerRecord = Database['odoo_gms_grower'];
export type FlagsRecord = Database['odoo_gms_flags'];
export type ProductionSchemeRecord = Database['odoo_gms_production_scheme'];
export type RegionRecord = Database['odoo_gms_region'];
export type DistributionPlanRecord = Database['odoo_gms_distribution_plan'];
export type ActivityRecord = Database['odoo_gms_activity'];
export type ProductionCycleRecord = Database['odoo_gms_production_cycle'];
export type ProductionCycleRegistrationRecord = Database['odoo_gms_production_cycle_registration'];