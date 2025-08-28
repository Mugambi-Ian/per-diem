import {Facebook, Instagram, Linkedin, Twitter, Youtube} from "lucide-react";

const socialIcons = [
    {icon: <Facebook/>, label: 'Facebook'},
    {icon: <Instagram/>, label: 'Instagram'},
    {icon: <Twitter/>, label: 'Twitter'},
    {icon: <Linkedin/>, label: 'LinkedIn'},
    {icon: <Youtube/>, label: 'YouTube'},
];

export function OurSocials(){
    return  <div
        className="flex border border-gray-300 w-min p-2 gap-4 rounded-lg">
        <p className="text-black dark:text-white pl-2">Follow</p>
        <div className="flex gap-4 flex-wrap w-max pr-2">
            {socialIcons.map(({icon, label}) => (
                <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition"
                >
                    {icon}
                </a>
            ))}
        </div>
    </div>
}